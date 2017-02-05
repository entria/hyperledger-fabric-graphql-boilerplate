import 'reify/repl';
import 'babel-polyfill';
import 'isomorphic-fetch';
import REPL from 'repl';
import replPromised from 'repl-promised';
import history from 'repl.history';
import hfc from 'hfc';
const babel = require('babel-core');

import fs from 'fs-promise';

import * as M from './src/graphql/model';
import connectDatabase from './src/graphql/database';

import setup from './src/blockchain/blockchain';
import {
  query,
  invoke,
  deploy,
} from './src/blockchain/helpers';

function queryEntity(user, chaincodeID, entity) {
  const queryRequest = {
    chaincodeID,
    fcn: 'query',
    args: [entity],
  };

  query(user, queryRequest);
}

function transfer(chaincodeID, chain, user, src, dest, qtd) {
  const invokeRequest = {
    // Name (hash) required for invoke
    chaincodeID,
    // Function to trigger
    fcn: 'invoke',
    // Parameters for the invoke function
    args: [src, dest, qtd.toString()],
  };

  invoke(chain, user, chaincodeID, invokeRequest);
}

const url = 'http://localhost:7050';

async function chainStats() {
  const response = await fetch(`${url}/chain`);
  const data = await response.json();

  return {
    response,
    data,
  };
}

async function blockStats(id) {
  const response = await fetch(`${url}/chain/blocks/${id}`);
  const data = await response.json();

  return {
    response,
    data,
  };
}

function preprocess(input) {
  const awaitMatcher = /^(?:\s*(?:(?:let|var|const)\s)?\s*([^=]+)=\s*|^\s*)(await\s[\s\S]*)/;
  const asyncWrapper = (code, binder) => {
    let assign = binder ? `global.${binder} = ` : '';
    return `(function(){ async function _wrap() { return ${assign}${code} } return _wrap();})()`;
  };

  // match & transform
  const match = input.match(awaitMatcher);
  if (match) {
    input = `${asyncWrapper(match[2], match[1])}`;
  }
  return input;
}

function myEval(cmd, context, filename, callback) {
  const code = babel.transform(preprocess(cmd), {
    plugins: [
      ['transform-flow-strip-types'],
    ],
    presets: ['es2015', 'stage-0'],
  }).code;
  _eval(code, context, filename, callback);
}

let _eval;

(async () => {
  try {
    await connectDatabase();

    const repl = REPL.start({
      prompt: 'fabric > ',
    });

    _eval = repl.eval;
    repl.eval = myEval;

    const blockchain = await setup();

    const {
      chaincodeID,
      chain,
      webUser: user,
    } = blockchain;

    const queryRequest = {
      chaincodeID,
      fcn: 'query',
      args: ['a'],
    };

    const invokeRequest = {
      // Name (hash) required for invoke
      chaincodeID,
      // Function to trigger
      fcn: 'invoke',
      // Parameters for the invoke function
      args: ['a', 'b', '10'],
    };

    repl.context.chainStats = chainStats;
    repl.context.blockStats = blockStats;

    repl.context.M = M;
    repl.context.hfc = hfc;
    repl.context.chaincodeID = chaincodeID;
    repl.context.chain = chain;
    repl.context.user = user;

    repl.context.query = (qr) => query(chaincodeID, user, qr);
    repl.context.queryEntity = (entity) => queryEntity(user, chaincodeID, entity);
    repl.context.queryRequest = queryRequest;

    repl.context.invoke = (ir) => invoke(chain, chaincodeID, user, ir);
    repl.context.transfer = (src, dest, qtd) => transfer(chaincodeID, chain, user, src, dest, qtd);
    repl.context.invokeRequest = invokeRequest;

    repl.context.deploy = () => deploy(user, 'init', ['a', '100', 'b', '200']);

    history(repl, `${process.env.HOME}/.node_history`);

    replPromised.promisify(repl);
  } catch (err) {
    console.error('Error: ', err);
    process.exit(1);
  }
})();


