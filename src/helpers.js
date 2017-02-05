import prettyFormat from 'pretty-format';

export function invoke(chaincodeID, chain, user, invokeRequest) {
  // const args = getArgs(config.invokeRequest);
  const eh = chain.getEventHub();
  // Construct the invoke request
  // const invokeRequest = {
  //   // Name (hash) required for invoke
  //   chaincodeID,
  //   // Function to trigger
  //   fcn: config.invokeRequest.functionName,
  //   // Parameters for the invoke function
  //   args,
  // };

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

export function query(user, queryRequest) {
  // Construct the query request
  // const queryRequest = {
  //   // Name (hash) required for query
  //   chaincodeID,
  //   // Function to trigger
  //   fcn: config.queryRequest.functionName,
  //   // Existing state variable to retrieve
  //   args: ['a'],
  // };

  // Trigger the query transaction
  const queryTx = user.query(queryRequest);

  // Print the query results
  queryTx.on('complete', (results) => {
    // Query completed successfully
    console.log(`\nSuccessfully queried  chaincode function: request=${prettyFormat(queryRequest)}, value=${prettyFormat(results)}: ${results.result.toString()}`);
  });
  queryTx.on('error', (err) => {
    // Query failed
    console.log(`\nFailed to query chaincode, function: request=${prettyFormat(queryRequest)}, error=${prettyFormat(err)}`);
  });
}
