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
const Fabric_CA_Client = require('fabric-ca-client');
const path = require('path');

const enrollID = "admin";
const enrollSecret = "WRITE_THE_ENROLL_SECRET_HERE";//write the enroll secret here 
const ca_url_with_port = "WRITE_THE_CA_URL_WITH_PORT_HERE";//write the CA URL with port here
const caName = "org1CA";

const fabric_client = new Fabric_Client();
const store_path = path.join(__dirname, 'hfc-key-store');
let fabric_ca_client = null;
let admin_user = null;

Fabric_Client.newDefaultKeyValueStore({
  path: store_path
}).then((state_store) => {
  fabric_client.setStateStore(state_store);
  const crypto_suite = Fabric_Client.newCryptoSuite();
  const crypto_store = Fabric_Client.newCryptoKeyStore({ path: store_path });
  crypto_suite.setCryptoKeyStore(crypto_store);
  fabric_client.setCryptoSuite(crypto_suite);
  fabric_ca_client = new Fabric_CA_Client('https://' + enrollID + ':' + enrollSecret + '@' + ca_url_with_port, null , caName, crypto_suite);
  return fabric_client.getUserContext(enrollID, true); 
}).then((user_from_store) => {
  if (user_from_store && user_from_store.isEnrolled()) {// check if the admin is already enrolled
    admin_user = user_from_store;
    return null;
  } else {
    return fabric_ca_client.enroll({
      enrollmentID: enrollID,
      enrollmentSecret: enrollSecret
    }).then((enrollment) => {
      return fabric_client.createUser(
        {
          username: enrollID,
          mspid: 'org1',
          cryptoContent: { privateKeyPEM: enrollment.key.toBytes(), signedCertPEM: enrollment.certificate }
        });
    }).then((user) => {
      admin_user = user;
      return fabric_client.setUserContext(admin_user);
    }).catch((err) => {
      throw new Error('Failed to enroll admin' + err);
    });
  }
}).then(() => {
  console.log('Assigned the admin user to the fabric client ::' + admin_user.toString());
}).catch((err) => {
  console.error('Failed to enroll admin: ' + err);
});
