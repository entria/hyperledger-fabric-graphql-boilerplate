import prettyFormat from 'pretty-format';
import fs from 'fs';
import seqqueue from 'seq-queue';
import { local, bluemix } from './config';

const onBluemix = process.env.NODE_ENV === 'production';
const config = onBluemix ? bluemix : local; // deploy locally or on bluemix
const chaincodeIdFile = 'chaincode_id';
const chaincodeIdPath = `${config.chaincode.deployedDir}/${chaincodeIdFile}`;

// Promisify hfc functions
export const enroll = (chain, enrollId, enrollSecret) =>
  new Promise((resolve, reject) => {
    chain.enroll(enrollId, enrollSecret, (err, user) => {
      if (err) return reject(err);

      return resolve(user);
    });
  });

export const deploy = (user, fcn, args) =>
  new Promise((resolve, reject) => {
    // console.log('deploys: ', config.deployRequest.chaincodePath);
    // console.log('path: ', chaincodePath);

    const deployRequest = {
      // Function to trigger
      fcn,
      // Arguments to the initializing function
      args,
      chaincodePath: config.chaincode.projectName,
      // the location where the startup and HSBN store the certificates
      // certificatePath: network.cert_path,
    };

    if (onBluemix) deployRequest.certificatePath = config.cert;

    console.log('deploy: ', deployRequest);

    // Trigger the deploy transaction
    const deployTx = user.deploy(deployRequest);

    deployTx.on('submitted', (results) => {
      console.log('submitted: ', results);
    });

    // Print the deploy results
    deployTx.on('complete', (results) => {
      console.log('deploy completed: ', results);

      // Deploy request completed successfully
      const chaincodeID = results.chaincodeID;
      console.log(`\nChaincode ID : ${chaincodeID}`);
      // Save the chaincodeID

      saveChaincodeID(chaincodeID);

      resolve(results);
    });

    deployTx.on('error', (err) => {
      // Deploy request failed
      console.log('error on deploy: ', prettyFormat(err));

      reject(err);
    });
  });

export const invoke = (chain, user, chaincodeID, invokeRequest) =>
  new Promise((resolve, reject) => {
    const eh = chain.getEventHub();

    const invokeTx = user.invoke(invokeRequest);

    // Print the invoke results
    invokeTx.on('submitted', (results) => {
      // Invoke transaction submitted successfully
      console.log(`\nSuccessfully submitted chaincode invoke transaction: request=${prettyFormat(invokeRequest)}, response=${prettyFormat(results)}`);
    });
    invokeTx.on('complete', (results) => {
      // Invoke transaction completed successfully
      console.log(`\nSuccessfully completed chaincode invoke transaction: request=${prettyFormat(invokeRequest)}, response=${prettyFormat(results)}`);
      resolve(results);
    });
    invokeTx.on('error', (err) => {
      // Invoke transaction submission failed
      console.log(`\nFailed to submit chaincode invoke transaction: request=${prettyFormat(invokeRequest)}, error=${prettyFormat(err)}`);
      // process.exit(1);
      reject(err);
    });

    // Listen to custom events
    const regid = eh.registerChaincodeEvent(chaincodeID, 'evtsender', (event) => {
      console.log(`Custom event received, payload: ${event.payload.toString()}\n`);
      eh.unregisterChaincodeEvent(regid);
    });
  });

export const query = (user, queryRequest) =>
  new Promise((resolve, reject) => {
    const queryTx = user.query(queryRequest);

    // Print the query results
    queryTx.on('complete', (results) => {
      // Query completed successfully
      console.log(`\nSuccessfully queried  chaincode function: request=${prettyFormat(queryRequest)}, value=${prettyFormat(results)}: ${results.result.toString()}`);

      if (results) return resolve(JSON.parse(results.result));

      resolve(results);
    });
    queryTx.on('error', (err) => {
      // Query failed
      console.log(`\nFailed to query chaincode, function: request=${prettyFormat(queryRequest)}, error=${prettyFormat(err)}`);

      reject(err);
    });
  });

export function saveChaincodeID(id) {
  fs.writeFile(chaincodeIdPath, id);
}
