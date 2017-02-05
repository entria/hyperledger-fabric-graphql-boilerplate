process.env.GOPATH = __dirname;

const hfc = require('hfc');
const util = require('util');
const fs = require('fs');
const https = require('https');

let config;
let chain;
let network;
let certPath;
let peers;
let users;
let userObj;
let newUserName;
let chaincodeID;
let certFile = 'us.blockchain.ibm.com.cert';
const chaincodeIDPath = `${__dirname}/chaincodeID`;


let caUrl;
let peerUrls = [];
const EventUrls = [];

init();

function init() {
  try {
    config = JSON.parse(fs.readFileSync(`${__dirname}/config.json`, 'utf8'));
  } catch (err) {
    console.log('config.json is missing or invalid file, Rerun the program with right file');
    process.exit();
  }

    // Create a client blockchin.
  chain = hfc.newChain(config.chainName);
    // path to copy the certificate
  certPath = `${__dirname}/src/${config.deployRequest.chaincodePath}/certificate.pem`;

    // Read and process the credentials.json
  try {
    network = JSON.parse(fs.readFileSync(`${__dirname}/ServiceCredentials.json`, 'utf8'));
    if (network.credentials) network = network.credentials;
  } catch (err) {
    console.log('ServiceCredentials.json is missing or invalid file, Rerun the program with right file');
    process.exit();
  }

  peers = network.peers;
  users = network.users;

  setup();

  printNetworkDetails();
    // Check if chaincode is already deployed
    // TODO: Deploy failures aswell returns chaincodeID, How to address such issue?
  if (fileExists(chaincodeIDPath)) {
        // Read chaincodeID and use this for sub sequent Invokes/Queries
    chaincodeID = fs.readFileSync(chaincodeIDPath, 'utf8');
    chain.getUser(newUserName, (err, user) => {
      if (err) throw Error(` Failed to register and enroll ${deployerName}: ${err}`);
      userObj = user;
      invoke();
    });
  } else {
    enrollAndRegisterUsers();
  }
}

function setup() {
    // Determining if we are running on a startup or HSBN network based on the url
    // of the discovery host name.  The HSBN will contain the string zone.
  const isHSBN = peers[0].discovery_host.indexOf('secure') >= 0 ? true : false;
  const network_id = Object.keys(network.ca);
  caUrl = `grpcs://${network.ca[network_id].discovery_host}:${network.ca[network_id].discovery_port}`;

    // Configure the KeyValStore which is used to store sensitive keys.
    // This data needs to be located or accessible any time the users enrollmentID
    // perform any functions on the blockchain.  The users are not usable without
    // This data.
  const uuid = network_id[0].substring(0, 8);
  chain.setKeyValStore(hfc.newFileKeyValStore(`${__dirname}/keyValStore-${uuid}`));

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
  newUserName = config.user.username;
    // Make sure disconnect the eventhub on exit
  process.on('exit', () => {
    chain.eventHubDisconnect();
  });
}

function printNetworkDetails() {
  console.log('\n------------- ca-server, peers and event URL:PORT information: -------------');
  console.log('\nCA server Url : %s\n', caUrl);
  for (var i = 0; i < peerUrls.length; i++) {
    console.log('Validating Peer%d : %s', i, peerUrls[i]);
  }
  console.log('');
  for (var i = 0; i < eventUrls.length; i++) {
    console.log('Event Url on Peer%d : %s', i, eventUrls[i]);
  }
  console.log('');
  console.log('-----------------------------------------------------------\n');
}

function enrollAndRegisterUsers() {
    // Enroll a 'admin' who is already registered because it is
    // listed in fabric/membersrvc/membersrvc.yaml with it's one time password.
  chain.enroll(users[0].enrollId, users[0].enrollSecret, (err, admin) => {
    if (err) throw Error(`\nERROR: failed to enroll admin : ${err}`);

    console.log('\nEnrolled admin sucecssfully');

        // Set this user as the chain's registrar which is authorized to register other users.
    chain.setRegistrar(admin);

        // creating a new user
    const registrationRequest = {
      enrollmentID: newUserName,
      affiliation: config.user.affiliation,
    };
    chain.registerAndEnroll(registrationRequest, (err, user) => {
      if (err) throw Error(` Failed to register and enroll ${newUserName}: ${err}`);

      console.log(`\nEnrolled and registered ${newUserName} successfully`);
      userObj = user;
            // setting timers for fabric waits
      chain.setDeployWaitTime(config.deployWaitTime);
      console.log('\nDeploying chaincode ...');
      deployChaincode();
    });
  });
}

function deployChaincode() {
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

    // Trigger the deploy transaction
  const deployTx = userObj.deploy(deployRequest);

    // Print the deploy results
  deployTx.on('complete', (results) => {
        // Deploy request completed successfully
    chaincodeID = results.chaincodeID;
    console.log(`\nChaincode ID : ${chaincodeID}`);
    console.log(util.format('\nSuccessfully deployed chaincode: request=%j, response=%j', deployRequest, results));
        // Save the chaincodeID
    fs.writeFileSync(chaincodeIDPath, chaincodeID);
    invoke();
  });

  deployTx.on('error', (err) => {
        // Deploy request failed
    console.log(util.format('\nFailed to deploy chaincode: request=%j, error=%j', deployRequest, err));
    process.exit(1);
  });
}

function invoke() {
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

    // Trigger the invoke transaction
  const invokeTx = userObj.invoke(invokeRequest);

    // Print the invoke results
  invokeTx.on('submitted', (results) => {
        // Invoke transaction submitted successfully
    console.log(util.format('\nSuccessfully submitted chaincode invoke transaction: request=%j, response=%j', invokeRequest, results));
  });
  invokeTx.on('complete', (results) => {
        // Invoke transaction completed successfully
    console.log(util.format('\nSuccessfully completed chaincode invoke transaction: request=%j, response=%j', invokeRequest, results));
    query();
  });
  invokeTx.on('error', (err) => {
        // Invoke transaction submission failed
    console.log(util.format('\nFailed to submit chaincode invoke transaction: request=%j, error=%j', invokeRequest, err));
    process.exit(1);
  });

    // Listen to custom events
  const regid = eh.registerChaincodeEvent(chaincodeID, 'evtsender', (event) => {
    console.log(util.format('Custom event received, payload: %j\n', event.payload.toString()));
    eh.unregisterChaincodeEvent(regid);
  });
}

function query() {
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

    // Trigger the query transaction
  const queryTx = userObj.query(queryRequest);

    // Print the query results
  queryTx.on('complete', (results) => {
        // Query completed successfully
    console.log('\nSuccessfully queried  chaincode function: request=%j, value=%s', queryRequest, results.result.toString());
    process.exit(0);
  });
  queryTx.on('error', (err) => {
        // Query failed
    console.log('\nFailed to query chaincode, function: request=%j, error=%j', queryRequest, err);
    process.exit(1);
  });
}

function getArgs(request) {
  const args = [];
  for (let i = 0; i < request.args.length; i++) {
    args.push(request.args[i]);
  }
  return args;
}

function fileExists(filePath) {
  try {
    return fs.statSync(filePath).isFile();
  } catch (err) {
    return false;
  }
}
