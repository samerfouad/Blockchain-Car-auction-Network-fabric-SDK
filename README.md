
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
the admin user. 

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
To do this, we need to download the connection profile, and move it to our current working directory. 
1. From IBM Blockchain Platform Starter Plan, we click on the `Overview` tab in the top-left corner.
2. From the `Overview` tab, we click on `Connection Profile`.
3. Then, we Click on `Download` to download a file that looks something like this: `creds_nde288ef7dd6542d3a1cc824a02be67f1_org1.json`. 
4. Rename the file to: `creds.json`. 
<b>And yes, this is important. It needs to be exactly `creds.json`, since this file is referenced at the top of </b>`invoke.js`.
5. Move the `creds.json` file to the `car-auction-network-fabric-node-sdk` directory. 

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

We need to install and instantiate the chaincode on the peers. 
From the `Overview` tab on the left, click on `Install Code` on the bottom-left hand side of the screen. Then, click on `Install Chaincode` on the right-side of the screen.
You should be prompted with the following form: 

```
Chaincode ID:   
Chaincode Version: 
Chaincode Type: 
```

Fill it out as shown below: 

```
Chaincode ID: carauction  
Chaincode Version: 1.0.0
Chaincode Type: Node
```

Note: `Chaincode Version` should match the version in the `package.json`. 

To update the chaincode, we need to increase the `Chaincode Version`. 

<b>READ CAREFULLY - UPLOAD BOTH CHAINCODE AND PACKAGE.JSON IN THIS STEP</b>

Choose your chaincode files from the `car-auction-network-fabric-node-sdk/chaincode` directory. 
Inside that directory, you should find a `package.json` and `carauction.js` file. Select both of those.
You should see `2 files selected`. Then click `Submit`.

Once the chaincode in installed, we need to instantiate it. From the same screen, click on the 
3-dot symbol under `Actions`. Then click `Instantiate`.

For `Chaincode Type` select `Node`. Then click `Next`. 
Next, leave the defaults on the next screen, which show a simple endorsement policy. 
Just click `Submit`. 
Note - the policy specifies which peers will need to validate a new transaction. 
We are choosing the simple policy here to keep things short and simple. 

Next, let's click on the `Channels` tab on the left side. 
Then click on the `defaultchannel`.
You should see the `total blocks` and `time since last transaction`.

Open `invoke.js` in the editor of your choice. You'll see at the top of the file
we import our connection profile from IBM Blockchain Platform with this line: 

```
var creds = require('./creds.json');
```

Just save the file and then use this command to invoke chaincode on our network:

```
$ node invoke.js
```

Lastly, we can refresh our page where we can see the details of `defaultchannel` and we should see a our total blocks increase by one. 
This is due to our last call to `invoke.js`. 

## Step 4. Running the app 

Now that we have connected our app to the IBM Blockchain Platform, each update of the ledger will be recorded and added as a block. 
Let's run our app and see what it can do. 

Note that in initLedger we created a car and assigned the owner of the car to be `memberA@acme.org`. 
Our auction does not allow the owner of car to bid on his/her own car. 
<b>Thus, this call should give us an error.</b> 
This step is to show you the error throwing capabilities of the chaincode.
Let's try it. Save `invoke.js` and then run this command to invoke our app. 


```
node invoke.js makeOffer 3000 ABCD memberA@acme.org
```

You should get an error message. 

Next, let's give a successful transaction. 
```
node invoke.js makeOffer 4000 ABCD memberB@acme.org
```
This should work, and now we have an offer from MemberB coming in at $4,000. 
If we check the channel in Starter Plan, we can see the data that was written to the ledger.

Next, let's give another successful offer. 
```
node invoke.js makeOffer 5000 ABCD memberC@acme.org
```
This will create an offer from Member C coming in at $5,000, which is greater than the reserve price.
If we check the Starter Plan again, we can see this data being written to the ledger, and the block count
increasing by one.

Next, let's give an offer that is too high...that is the offer is greater than the balance in the account.
<b> Note - this should throw an error. This is to show error checks of the chaincode. </b>
```
node invoke.js makeOffer 5001 ABCD memberB@acme.org
```
Since our members are initialized with a balance of $5,000, this will not work. 
Lastly, let's close the bidding. 
```
node invoke.js closeBidding ABCD
```
You should get a successful response. If you check the output of the block details, we can see 
that the new owner of the car is MemberC. We also see that Member C now has $0 in their balance,
since they had $5,000 to start with, and their bid of $5,000 won the auction. That means that 
the new owner is Member C, and that Member A, the original owner of the car, will be credited
$5,000. This is reflected on the ledger - Member A now has a balance of $10,000. Lastly,
if we check the vehicle listing, we can see that the status is `SOLD`.

## Step 5. Querying the Ledger

Now that we have submitted transactions on the ledger, we can query the ledger at any point, using the 
key corresponding to that object. So first, let's query Member A. This is the member that just won 
the auction, so they should have $10,000 in their account. 
```
node invoke.js query memberA@acme.org
```

Our response should look something like this:

```
Response is  {"balance":10000,"firstName":"Amy","lastName":"Williams"}
```

We can query memberB as follows, but this is not too interesting since memberB 
did not win the auction.

Now, if we query memberC, we should see that their balance is 0. The 
request should look as follows for memberC:

```
node invoke.js query memberB@acme.org
```

Now if we query the vehicle number, we should see the owner be memberC. 
Let's do that with the following request:

```
node invoke.js query 1234
```

Lastly, and most interestingly, let's query our vehicle listing. 
It should show up s being SOLD, and should have no offers.

The request:

```
noe invoke.js query ABCD
```

# License
This code pattern is licensed under the Apache Software License, Version 2.  Separate third party code objects invoked within this code pattern are licensed by their respective providers pursuant to their own separate licenses. Contributions are subject to the [Developer Certificate of Origin, Version 1.1 (DCO)](https://developercertificate.org/) and the [Apache Software License, Version 2](http://www.apache.org/licenses/LICENSE-2.0.txt).

[Apache Software License (ASL) FAQ](http://www.apache.org/foundation/license-faq.html#WhatDoesItMEAN)
