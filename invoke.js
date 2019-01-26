/* Copyright 2018 IBM All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the 'License');
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at 
		http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an 'AS IS' BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.*/

'use strict';

const Fabric_Client = require('fabric-client');
const path = require('path');
const creds = require('./creds.json');

const enrollID = "admin";
const funcName = process.argv[2];
let array = process.argv;
array.shift(); array.shift(); array.shift();

const fabric_client = new Fabric_Client();
const channel = fabric_client.newChannel('defaultchannel');
const peer = fabric_client.newPeer(creds.peers['org1-peer1'].url, { pem: creds.peers['org1-peer1'].tlsCACerts.pem, 'ssl-target-name-override': null });
const order = fabric_client.newOrderer(creds.orderers.orderer.url, { pem: creds.orderers.orderer.tlsCACerts.pem, 'ssl-target-name-override': null });
channel.addPeer(peer);
channel.addOrderer(order);

const store_path = path.join(__dirname, 'hfc-key-store');
let member_user = null;
let tx_id = null;

Fabric_Client.newDefaultKeyValueStore({
  path: store_path
}).then((state_store) => {
  fabric_client.setStateStore(state_store);
  const crypto_suite = Fabric_Client.newCryptoSuite();
  const crypto_store = Fabric_Client.newCryptoKeyStore({ path: store_path });
  crypto_suite.setCryptoKeyStore(crypto_store);
  fabric_client.setCryptoSuite(crypto_suite);
  return fabric_client.getUserContext(enrollID, true); //get the enrolled user from persistence
}).then((user_from_store) => {

  if (user_from_store && user_from_store.isEnrolled()) {
    member_user = user_from_store;
  } else {
    throw new Error('Failed to get admin');
  }

  tx_id = fabric_client.newTransactionID(); //get a transaction id based on the current user

  const request = {
          chaincodeId: 'carauction',
          fcn: funcName,
          args: array,
          chainId: 'mychannel',
          txId: tx_id
      };

  if (funcName === "query") {
    return channel.queryByChaincode(request);
  } else {
    return channel.sendTransactionProposal(request); 
  }

}).then((results) => {

  if (funcName === "query"){
    if (results && results.length == 1) {
      if (results[0] instanceof Error) {
        console.error('error from query = ', results[0]);
      } else {
        console.log('Response is ', results[0].toString());
      }
    } else {
      console.log('No payloads were returned from query');      
    }
    return null;
  } else {
    const proposalResponses = results[0];
    const proposal = results[1];
    let isProposalGood = false;
    if (proposalResponses && proposalResponses[0].response && proposalResponses[0].response.status === 200) {
      isProposalGood = true;
      console.log('Transaction proposal was good');
    } else {
      console.error(results);
    }

    if (isProposalGood) {
      const request = { // the request for the orderer to have the transaction committed
        proposalResponses: proposalResponses,
        proposal: proposal
      };
      const transaction_id_string = tx_id.getTransactionID(); //Get the transaction ID string to be used by the event processing
      const sendPromise = channel.sendTransaction(request);
      let promises = [];      
      promises.push(sendPromise); //we want the send transaction first, so that we know where to check status
      const event_hub = channel.newChannelEventHub(peer);// get an eventhub once the fabric client has a user assigned
  
      const txPromise = new Promise((resolve, reject) => {
        const handle = setTimeout(() => {
          event_hub.unregisterTxEvent(transaction_id_string);
          event_hub.disconnect();
          resolve({ event_status: 'TIMEOUT' });
        }, 3000);
        event_hub.registerTxEvent(transaction_id_string, (tx, code) => {
          clearTimeout(handle);
          const return_status = { event_status: code, tx_id: transaction_id_string };
          if (code !== 'VALID') {
            console.error('The transaction was invalid, code = ' + code);            
          } else {
            console.log('The transaction has been committed on peer ' + event_hub.getPeerAddr());
          }
          resolve(return_status);
        }, (err) => {
          reject(new Error('There was a problem with the eventhub ::' + err));  //this is the callback if something goes wrong with the event registration or processing
        },
          { disconnect: true } //disconnect when complete
        );
        event_hub.connect();
      });

      promises.push(txPromise);
      return Promise.all(promises);

    } else {
      throw new Error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
    }

  } 
}).then((results) => {
  if (funcName === "query") return null;

  if (results && results[0] && results[0].status === 'SUCCESS') {
    console.log('Successfully sent transaction to the orderer.');
  } else {
    console.error('Failed to order the transaction. Error code: ' + results[0].status);
  }
  if (results && results[1] && results[1].event_status === 'VALID') {
    console.log('Successfully committed the change to the ledger by the peer');
  } else {
    console.log('Transaction failed to be committed to the ledger due to ::' + results[1].event_status);
  }

}).catch((err) => {
  console.error('Failed to invoke successfully :: ' + err);
});
