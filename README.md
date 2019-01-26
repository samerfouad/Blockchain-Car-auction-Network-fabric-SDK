
# Create a car auction network with Hyperledger Fabric Node.js Client SDK and IBM Blockchain Platform Starter Plan

In this Code Pattern we will create a blockchain network that simulates a car auction network. 

### Intro to Certificate Authority

The first step before diving into the car-auction logic is to enroll our application with our 
<b>[CA(Certificate Authority)](https://hyperledger-fabric.readthedocs.io/en/release-1.2/identity/identity.html#certificate-authorities)</b> from the IBM Blockchain Platform Starter Plan. To do this, we need to 
give our application the API endpoints of the CA on the IBM Blockchain Platform Starter plan so that our 
app can interact with the network. The CA will then provide us with certificates that will prove 
our authenticity to the network: it will allow us to transact (i.e. invoke chaincode) on the network.
Note - any calls to the Hyperledger Fabric network will have to be signed with a private key and a
properly signed X.509 certificate for verification purposes. All of our actors within our network (peers,
 orderers, client apps, admins) 
will each have a digital identity encapsulated in an X.509 certificate. We need certificates for
both an admin user, and a new user, that we can call `user1`. 

### Intro to Chaincode
After we have finished generating 
keys and certificates, we will need to install the chaincode on the peers. After the chaincode 
is installed, we will instantiate it, which will call the chaincode constructor and initiate 
some data on the ledger. This is seen in the `initLedger` function from the `chaincode/carauction.js` file.
 It will create a vehicle, a few members, and a vehicle listing (or a 
listing on which members can bid on).  After that, the members will make offers for the car, which is actually invoking 
chaincode under the hood. Note - when we <b> invoke chaincode, we are making a transaction </b> 
on the blockchain network. This is extremely important. Chaincode is <b> how we make transactions </b>
on the network. When we make an offer, the chaincode will check for two types of errors:

1) If the owner of the car bids on their own car
2) If the bidder has enough money in their account to make the bid

If both checks are passed, an offer is recorded on the ledger. Once the auction closes, we call the `closeBidding` transaction as seen in the `chaincode/carauction.js` file. That will give the car to the highest bidder, and transfer funds from the buyer to the seller. The buyer will gain ownership of the car.

To ensure that our auction has worked correctly, we can query the ledger at the end to ensure that the car has the correct owner, and that the seller has been credited the correct amount in their account.

Lastly, we will check the logs of the peers on the IBM Blockchain Platform Starter Plan, and also view the details of the blocks to see how transactions are recorded.

## Flow
1. User downloads IBM Blockchain Platform Starter Plan connection profile and adds url/secret for Certificate Authority in the Node app.
2. User enrolls admin with the Certificate Authority.
3. User installs, instantiates, and invokes carauction chaincode on the peer.
4. Ledger is updated, blocks are added to the Starter Plan service, and the response is sent to Node app.

# Watch the Video - Setting up the Node app
https://www.youtube.com/watch?v=3a8ElLxyQAc

# Prerequisites
1. NPM version >= 5.6.0 
2. Node version >= 8.10.0
3. If you do not have an IBM Cloud account yet, you will need to create one [here](https://ibm.biz/BdjLxy).
4. In your IBM Cloud account, create a Blockchain Starter Plan service on your IBM Cloud account.
Then, click on `Launch`, after your network is created. 

# Steps

## Step 1. Clone the repo
The first thing we need to do is clone the repo on your local computer.
```
$ git clone https://github.com/fady-a-m-ibrahim/car-auction-network-fabric-node-sdk
```
Then, go ahead and go into the directory:
```
$ cd car-auction-network-fabric-node-sdk
```

## Step 2. Enroll App 
 
First, we need to generate the necessary keys and certs from the Certificate Authority to prove our authenticity to the network.
To do this, we will go into our new IBM Blockchain Platform Starter Plan network, and from the `Overview` Tab on the left, we will click on `Connection Profile` on the right-side of the page. Then click on `Raw JSON`.

Open `enrolladmin.js` in an editor of your choice. I prefer VSCode.

At the begining of the file, we will see `const enrollSecret = = "WRITE_THE_ENROLL_SECRET_HERE";`. 
We should change `WRITE_THE_ENROLL_SECRET_HERE` by the `enrollSecret` from the Certificate Authority. 
It something similar to "1dcab332aa".
In the same way we should change `const ca_url_with_port = "WRITE_THE_CA_URL_WITH_PORT_HERE";` by the `url` from the Certificate Authority. 
It something similar to "nde288ef7dd7542d3a1cc824a02be67f1-org1-ca.us02.blockchain.ibm.com:31011".
Please note, we donot copy `https://`
Save your file, and run:

```
$ npm install
```

Then, run this command to enroll the admin:

```
$ node enrollAdmin.js
```

## Step 3. Invoking Chaincode 
![packageFile](/docs/invoke.gif)

Now, we need to download the connection profile, and move it to our current working directory. 
1. Go back to your IBM Blockchain Platform Starter Plan, and click on the `Overview` tab in the top-left corner.
2. From the `Overview` tab, click on `Connection Profile`.
3. Once you click on `Connection Profile` you'll have an option to view as `Raw JSON` or `Download`. Click on `Download`. 

This should automatically download the file and add it to your recently downloaded folder.
This recently downloaded file will look something like this:

`creds_nde288ef7dd6542d3a1cc824a02be67f1_org1.json`. 

4. Rename the file to: `creds.json`. 

<b>And yes, this is important. It needs to be exactly `creds.json`, since 
this file is referenced at the top of </b>`invoke.js` - https://github.com/IBM/car-auction-network-fabric-node-sdk/blob/master/invoke.js#L10.

5. Move the `creds.json` file to the `car-auction-network-fabric-node-sdk` directory. 

Next, we need to install the chaincode on the peers. Then, we will need to instantiate the chaincode. 
From the `Overview` tab on the left, click on `Install Code` on the bottom-left hand side of the screen. Then, click on `Install Chaincode` on 
the right-side of the screen.

You should be prompted with the following form: 

```
Chaincode ID:   
Chaincode Version: 
Chaincode Type: 
```

Fill it out as shown below: 

```
Chaincode ID: carauction  
Chaincode Version: 1
Chaincode Type: Node
```

To do this, simply fill out the form with the same exact way,  and increase the `Chaincode Version` by one. This will enable you to do a chaincode update, and will allow you to use the new chaincode when invoking transactions 

⚠️🚧⚠️ <b>READ CAREFULLY - UPLOAD BOTH CHAINCODE AND PACKAGE.JSON IN THIS STEP</b> ⚠️🚧⚠️

Choose your chaincode files from the `car-auction-network-fabric-node-sdk/chaincode` (recently cloned) 
directory. 
Inside that directory, you should find a `package.json` and `carauction.js` file. Select both of those.
You should see `2 files selected`. Then click `Submit`.

Once the chaincode in installed, we need to instantiate it. From the same screen, click on the 
3-dot symbol under `Actions`. Then click `Instantiate`.

⚠️🚧⚠️ Note: If you get an error after clicking `Instantiate` ⚠️🚧⚠️ it might be because your version on IBM Blockchain Platform doesn't match the version in the `package.json`. Try filling in ```Chaincode Version: 1.0.0``` instead.

For `Chaincode Type` select `Node`. Then click `Next`. Next, leave the defaults on the next screen,
which show a simple endorsement policy. Just click `Submit`. Note - the policy specifies which peers
will need to validate a new transaction. We are choosing the 
simple policy here to keep things short and simple. For a more complex network, you can 
choose the advanced option to give certain members more influence in validating a new transaction. Click [here](https://console.bluemix.net/docs/services/blockchain/howto/install_instantiate_chaincode.html#installing-instantiating-and-updating-a-chaincode)
to learn more. 

Next, let's click on the `Channels` tab on the left side. Then click on the `defaultchannel`.
You should see the `total blocks` and `time since last transaction`. If we click on the 
block number, we can see our `initLedger` function being called, and the data that was 
written to the ledger.

Open `invoke.js` in the editor of your choice. You'll see at the top of the file
we import our connection profile from IBM Blockchain Platform with this line: 

```
var creds = require('./creds.json');
```

Just save the file and then use this command to invoke chaincode on our network:

```
$ node invoke.js
```

If all went well, you should see something like this: 

```
carauction 👉🏼  node invoke.js
Store path:/Users/Horea.Porutiu@ibm.com/Workdir/blockchain/carauction/hfc-key-store
Successfully loaded user1 from persistence
Assigning transaction_id:  812694fba979d495423a40701fed3b221e7d7add2eecde8f9dd9a64827c8aced
Transaction proposal was good
Successfully sent Proposal and received ProposalResponse: Status - 200, message - "OK"
The transaction has been committed on peer n9fb94659f16c4d85a20219df994288bb-org1-peer1.us03.blockchain.ibm.com:31002
Send transaction promise and event listener promise have completed
Successfully sent transaction to the orderer.
Successfully committed the change to the ledger by the peer
```

Lastly, we can refresh our page where we can see the details of `defaultchannel` and we 
should see a our total blocks increase by one. This is due to our last call to `invoke.js`. 

If you look around line 60 of `invoke.js` you should see this: 

```
    var request = {
        //targets: let default to the peer assigned to the client
        chaincodeId: 'carauction',
        fcn: 'initLedger',
        args: [''],
        chainId: 'mychannel',
        txId: tx_id
      };
```
This is where we call the different functions in our chaincode. By default, we call initLedger.
This is why our new block reflects this function call. 

## Step 5. Running the app 
![packageFile](/docs/runApp.gif)

Now that we have connected our app to the IBM Blockchain Platform, each update of the ledger will
be recorded and added as a block. Let's run our app and see what it can do. You can find all
commands that I run in this step at `snips.txt` in this repo.

Go to line 60 of `invoke.js` and copy and paste this code instead what was there before. We are now
going to call the makeOffer method and pass in 3 arguments as shown in the code below:

```
var request = {
    //targets: let default to the peer assigned to the client
    chaincodeId: 'carauction',
    fcn: 'makeOffer',
    args: ['3000', 'ABCD', 'memberA@acme.org'],
    chainId: 'mychannel',
    txId: tx_id
  };
```

Note that in initLedger we created a car and assigned the owner of the car to be `memberA@acme.org`. 
Our auction does not allow the owner of car to bid on his/her own car. <b>Thus, this call should give 
us an error.</b> This step is to show you the error throwing capabilities of the chaincode.
Let's try it. Save `invoke.js` and then run this command to invoke our app. Note, this 
step (the node invoke step) will be repeated 5 more times below, but I will exclude it for the sake of repetition. So 
remember, every time you want to invoke our app, you'll need to change the request variable,
save the file, and then run the command below: 

```
$ node invoke.js
```

You should get an error message like this: 
```
Assigning transaction_id:  06c289642a2b8cfd6c0cff41411c5b6a6fa45472f4e5af56c6adee3f06d98b71
[ [ { Error: 2 UNKNOWN: error executing chaincode: transaction returned with failure: Error: owner cannot bid on own item:
    at...
```

Next, let's give a successful transaction. Copy and paste the code for the request as follows:

```
var request = {
    //targets: let default to the peer assigned to the client
    chaincodeId: 'carauction',
    fcn: 'makeOffer',
    args: ['4000', 'ABCD', 'memberB@acme.org'],
    chainId: 'mychannel',
    txId: tx_id
  };
```
This should work, and now we have an offer from MemberB coming in at $4,000. If we check the 
channel in Starter Plan, we can see the data that was written to the ledger.

Next, let's give another successful offer. Copy and paste the code for the request as follows:

```
var request = {
    //targets: let default to the peer assigned to the client
    chaincodeId: 'carauction',
    fcn: 'makeOffer',
    args: ['5000', 'ABCD', 'memberC@acme.org'],
    chainId: 'mychannel',
    txId: tx_id
  };
```

This will create an offer from Member C coming in at $5,000, which is greater than the reserve price.
If we check the Starter Plan again, we can see this data being written to the ledger, and the block count
increasing by one.

Next, let's give an offer that is too high...that is the offer is greater than the balance in the account.
<b> Note - this should throw an error. This is to show error checks of the chaincode. </b>

```
var request = {
    //targets: let default to the peer assigned to the client
    chaincodeId: 'carauction',
    fcn: 'makeOffer',
    args: ['5001', 'ABCD', 'memberB@acme.org'],
    chainId: 'mychannel',
    txId: tx_id
  };
```
Since our members are initialized with a balance of $5,000, this will not work. You should get an error 
message as follows: 

```
{ Error: 2 UNKNOWN: error executing chaincode: transaction returned with failure: Error: The bid is higher than the balance in your account!
```

Lastly, let's close the bidding. Use this code as follows for the request:

```
  var request = {
    //targets: let default to the peer assigned to the client
    chaincodeId: 'carauction',
    fcn: 'closeBidding',
    args: ['ABCD'],
    chainId: 'mychannel',
    txId: tx_id
  };
```

Save the file and issue the 
following command, as we have been doing all along up to this point. 
```
$ node invoke.js
```

You should get a successful response. If you check the output of the block details, we can see 
that the new owner of the car is MemberC. We also see that Member C now has $0 in their balance,
since they had $5,000 to start with, and their bid of $5,000 won the auction. That means that 
the new owner is Member C, and that Member A, the original owner of the car, will be credited
$5,000. This is reflected on the ledger - Member A now has a balance of $10,000. Lastly,
if we check the vehicle listing, we can see that the status is `SOLD`.

Awesome! You just successfully ran an auction app while using Hyperledger Fabric Node SDK + IBM Blockchain Platform
Starter Plan. There's only one more thing I want to show you before you leave...

## Step 6. Querying the Ledger
![packageFile](/docs/query.gif)

Now that we have submitted transactions on the ledger, we can query the ledger at any point, using the 
key corresponding to that object. So first, let's query Member A. This is the member that just won 
the auction, so they should have $10,000 in their account. To query, open up `query.js` in the editor
of your choice. Just like `invoke.js` there is a request variable that allows us to pass in a 
key to query the ledger. Let's pass in `memberA@acme.org` for the key. The request variable
on line 55, should as follows:

```
  const request = {
    //targets : --- letting this default to the peers assigned to the channel
    chaincodeId: 'carauction',
    fcn: 'query',
    args: ['memberA@acme.org']
  };
```

Our response should look something like this:

```
Response is  {"balance":10000,"firstName":"Amy","lastName":"Williams"}
```

We can query memberB as follows, but this is not too interesting since memberB 
did not win the auction. The output for querying memberB is as follows:

```
Response is  {"balance":5000,"firstName":"Billy","lastName":"Thompson"}
```

Now, if we query memberC, we should see that their balance is 0. The 
request should look as follows for memberC:

```
  const request = {
    //targets : --- letting this default to the peers assigned to the channel
    chaincodeId: 'carauction',
    fcn: 'query',
    args: ['memberC@acme.org']
  };
```

With the response being:

```
Response is  {"balance":0,"firstName":"Tom","lastName":"Werner"}
```

Now if we query the vehicle number, we should see the owner be memberC. Let's 
do that with the following request:

```
  const request = {
    //targets : --- letting this default to the peers assigned to the channel
    chaincodeId: 'carauction',
    fcn: 'query',
    args: ['1234']
  };
```

The response:

```
Response is  {"owner":"memberC@acme.org"}
```

Lastly, and most interestingly, let's query our vehicle listing. It should show up
as being SOLD, and should have no offers.

The request:

```
  const request = {
    //targets : --- letting this default to the peers assigned to the channel
    chaincodeId: 'carauction',
    fcn: 'query',
    args: ['ABCD']
  };
```

The response:

```
Response is  {"description":"Arium Nova","listingState":"SOLD","offers":null,"reservePrice":3500,"vehicle":"1234"}
```
## Step 7. Conclusion + Updating Chaincode
Congrats!

🙌🏼🙌🏼🙌🏼

That's it! I showed you how to register your application and then register users 
to your application using certificates provided by the Certificate Authority. Next,
I showed you how to download your connection profile and use it to create a 
channel and add peers and an orderer to that channel. After that, we used the IBM
Blockchain Starter Plan to install our chaincode on the peers, and then 
instantiated our network on the defaultchannel. Next, we invoked our chaincode 
and created some offers on the network. We closed the bidding and saw our ledger
being updated as Member C won the auction. Lastly, we learned how to query the 
ledger to ensure that our data looks how we intend it to look.

🛑🛑🛑🛑🛑🛑🛑🛑🛑🛑🛑<b> Optional & Extra Credit - Updating Chaincode </b>🛑🛑🛑🛑🛑🛑🛑🛑🛑🛑🛑

> Note - if you want to update the chaincode - and add in your own functions, you will have to install the <b> updated chaincode</b> by <b> selecting the updated `carauction.js` and `package.json` files </b>. So follow the same process as shown above in step 4 to install chaincode, but use your newly updated files. For the form, you would fill it out as shown below, and keep incrementing the version number on subsequent updates:

```
Chaincode ID: carauction  
Chaincode Version: 2
Chaincode Type: Node
```

> Then, when you go to click on the action i.e. the three-dot button, there will be an option that says `update`. Choose that one and then keep the same defaults (the simple policy) as shown before. And that's it!

Hope you learned something, and if you find anything missing, encounter a nasty bug, error, etc. please open an issue on this repo above⤴⤴⤴⤴⤴! 🕷🕷🕷

<!-- If you check your downloaded files now, you should have a file starting with `cred` ending in `.json`. Let's rename this file to `creds.json` and move this file to the root of our carauction-network directory.

Open `enrolladmin.js` and the newly downloaded `creds.json` in an editor of your choice. I prefer VSCode. -->

<!-- [![Deploy to IBM Cloud](https://bluemix.net/deploy/button.png)](https://bluemix.net/deploy?repository=https://github.com/IBM/watson-second-opinion) -->

# License
This code pattern is licensed under the Apache Software License, Version 2.  Separate third party code objects invoked within this code pattern are licensed by their respective providers pursuant to their own separate licenses. Contributions are subject to the [Developer Certificate of Origin, Version 1.1 (DCO)](https://developercertificate.org/) and the [Apache Software License, Version 2](http://www.apache.org/licenses/LICENSE-2.0.txt).

[Apache Software License (ASL) FAQ](http://www.apache.org/foundation/license-faq.html#WhatDoesItMEAN)
