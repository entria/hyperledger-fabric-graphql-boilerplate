// @flow
/**
 * Hello Block Chain using es6/7
 */

import hfc from 'hfc';
import fs from 'fs';
import prettyFormat from 'pretty-format';
import config from '../config.json';
import network from '../ServiceCredentials.json';

let certFile = 'us.blockchain.ibm.com.cert';

const certPath = `${__dirname}/${config.deployRequest.chaincodePath}/certificate.pem`;
const chaincodeIDPath = `${__dirname}/../chaincodeID`;
let chaincodeID;

let caUrl;
let peerUrls = [];
let eventUrls = [];

init();

function init() {
  // Create a client blockchain
  const chain = hfc.newChain(config.chainName);

  const { peers, users } = network;

  setup(chain, peers);

  printNetworkDetails();

  // Check if chaincode is already deployed
  // TODO: Deploy failures aswell returns chaincodeID, How to address such issue?
  if (fileExists(chaincodeIDPath)) {
    // Read chaincodeID and use this for sub sequent Invokes/Queries
    chaincodeID = fs.readFileSync(chaincodeIDPath, 'utf8');
    chain.getUser(config.user.username, (err, user) => {
      if (err) throw Error(`Failed to register and enroll ${deployerName}: ${err}`);
      // userObj = user;
      invoke(chain, user);
    });
  } else {
    enrollAndRegisterUsers(chain, users);
  }
}

function setup(chain, peers) {
  // Determining if we are running on a startup or HSBN network based on the url
  // of the discovery host name.  The HSBN will contain the string zone.
  const isHSBN = peers[0].discovery_host.indexOf('secure') >= 0;
  const network_id = Object.keys(network.ca);
  caUrl = `grpcs://${network.ca[network_id].discovery_host}:${network.ca[network_id].discovery_port}`;

  // Configure the KeyValStore which is used to store sensitive keys.
  // This data needs to be located or accessible any time the users enrollmentID
  // perform any functions on the blockchain.  The users are not usable without
  // This data.
  const uuid = network_id[0].substring(0, 8);
  chain.setKeyValStore(hfc.newFileKeyValStore(`${__dirname}/../keyValStore-${uuid}`));

  if (isHSBN) {
    certFile = '0.secure.blockchain.ibm.com.cert';
  }

  fs.createReadStream(certFile).pipe(fs.createWriteStream(certPath));
  const cert = fs.readFileSync(certFile);

  chain.setMemberServicesUrl(caUrl, {
    pem: cert,
  });

  peerUrls = [];
  eventUrls = [];

  // Adding all the peers to blockchain
  // this adds high availability for the client
  for (let i = 0; i < peers.length; i++) {
    // Peers on Bluemix require secured connections, hence 'grpcs://'
    peerUrls.push(`grpcs://${peers[i].discovery_host}:${peers[i].discovery_port}`);
    chain.addPeer(peerUrls[i], {
      pem: cert,
    });
    eventUrls.push(`grpcs://${peers[i].event_host}:${peers[i].event_port}`);
    chain.eventHubConnect(eventUrls[0], {
      pem: cert,
    });
  }

  const { username } = config.user;
  // Make sure disconnect the eventhub on exit
  process.on('exit', () => {
    chain.eventHubDisconnect();
  });
}

function printNetworkDetails() {
  console.log('\n------------- ca-server, peers and event URL:PORT information: -------------');
  console.log(`\nCA server Url : ${caUrl}\n`);
  for (let i = 0; i < peerUrls.length; i++) {
    console.log(`Validating Peer ${i} : ${peerUrls[i]}`);
  }
  console.log('');
  for (let i = 0; i < eventUrls.length; i++) {
    console.log(`Event Url on Peer ${i} : ${eventUrls[i]}`);
  }
  console.log('');
  console.log('-----------------------------------------------------------\n');
}

function enrollAndRegisterUsers(chain, users) {
  // Enroll a 'admin' who is already registered because it is
  // listed in fabric/membersrvc/membersrvc.yaml with it's one time password.
  chain.enroll(users[0].enrollId, users[0].enrollSecret, (err, admin) => {
    if (err) throw Error('\nERROR: failed to enroll admin : ', err);

    console.log('\nEnrolled admin sucecssfully');

    // Set this user as the chain's registrar which is authorized to register other users.
    chain.setRegistrar(admin);

    // creating a new user
    const registrationRequest = {
      enrollmentID: config.user.username,
      affiliation: config.user.affiliation,
    };
    chain.registerAndEnroll(registrationRequest, (err, user) => {
      if (err) throw Error(` Failed to register and enroll ${config.user.username}: `, err);

      console.log(`\nEnrolled and registered ${config.user.username} successfully`);
      // const userObj = user;

      // setting timers for fabric waits
      chain.setDeployWaitTime(config.deployWaitTime);
      console.log('\nDeploying chaincode ...');
      deployChaincode(chain, user);
    });
  });
}

function deployChaincode(chain, user) {
  const args = getArgs(config.deployRequest);
  // Construct the deploy request
  const deployRequest = {
    // Function to trigger
    fcn: config.deployRequest.functionName,
    // Arguments to the initializing function
    args,
    chaincodePath: config.deployRequest.chaincodePath,
    // the location where the startup and HSBN store the certificates
    certificatePath: network.cert_path,
  };

  console.log('deployRequest: ', deployRequest);

  // Trigger the deploy transaction
  const deployTx = user.deploy(deployRequest);

  // Print the deploy results
  deployTx.on('complete', (results) => {
    // Deploy request completed successfully
    chaincodeID = results.chaincodeID;
    console.log('\nChaincode ID : ', chaincodeID);
    console.log(`\nSuccessfully deployed chaincode: request=${prettyFormat(deployRequest)}, response=${prettyFormat(results)}`);
    // Save the chaincodeID
    fs.writeFileSync(chaincodeIDPath, chaincodeID);
    invoke(chain, user);
  });

  deployTx.on('error', (err) => {
    // Deploy request failed
    console.log(`\nFailed to deploy chaincode: request=${prettyFormat(deployRequest)}, error=${prettyFormat(err)}`);
    process.exit(1);
  });
}

function invoke(chain, user) {
  const args = getArgs(config.invokeRequest);
  const eh = chain.getEventHub();
  // Construct the invoke request
  const invokeRequest = {
    // Name (hash) required for invoke
    chaincodeID,
    // Function to trigger
    fcn: config.invokeRequest.functionName,
    // Parameters for the invoke function
    args,
  };

  console.log('invokeRequest: ', invokeRequest);

  // Trigger the invoke transaction
  const invokeTx = user.invoke(invokeRequest);

  // Print the invoke results
  invokeTx.on('submitted', (results) => {
    // Invoke transaction submitted successfully
    console.log(`\nSuccessfully submitted chaincode invoke transaction: request=${prettyFormat(invokeRequest)}, response=${prettyFormat(results)}`);
  });
  invokeTx.on('complete', (results) => {
    // Invoke transaction completed successfully
    console.log(`\nSuccessfully completed chaincode invoke transaction: request=${prettyFormat(invokeRequest)}, response=${prettyFormat(results)}`);
    query(user);
  });
  invokeTx.on('error', (err) => {
    // Invoke transaction submission failed
    console.log(`\nFailed to submit chaincode invoke transaction: request=${prettyFormat(invokeRequest)}, error=${prettyFormat(err)}`);
    process.exit(1);
  });

  // Listen to custom events
  const regid = eh.registerChaincodeEvent(chaincodeID, 'evtsender', (event) => {
    console.log(`Custom event received, payload: ${event.payload.toString()}\n`);
    eh.unregisterChaincodeEvent(regid);
  });
}

function query(user) {
  const args = getArgs(config.queryRequest);
  // Construct the query request
  const queryRequest = {
    // Name (hash) required for query
    chaincodeID,
    // Function to trigger
    fcn: config.queryRequest.functionName,
    // Existing state variable to retrieve
    args,
  };

  console.log('queryRequest: ', queryRequest);

  // Trigger the query transaction
  const queryTx = user.query(queryRequest);

  // Print the query results
  queryTx.on('complete', (results) => {
    // Query completed successfully
    console.log(`\nSuccessfully queried  chaincode function: request=${prettyFormat(queryRequest)}, value=${prettyFormat(results)}: ${results.result.toString()}`);
    process.exit(0);
  });
  queryTx.on('error', (err) => {
    // Query failed
    console.log(`\nFailed to query chaincode, function: request=${prettyFormat(queryRequest)}, error=${prettyFormat(err)}`);
    process.exit(1);
  });
}

function getArgs(request) {
  return request.args.map(arg => arg);
}

function fileExists(filePath) {
  try {
    return fs.statSync(filePath).isFile();
  } catch (err) {
    return false;
  }
}
