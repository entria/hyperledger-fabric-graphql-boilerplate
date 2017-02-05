import path from 'path';
import fs from 'fs';
import hfc from 'hfc';
import { local, bluemix } from './config';
import {
  enroll,
  deploy,
} from './helpers';

const onBluemix = process.env.NODE_ENV === 'production';
const config = onBluemix ? bluemix : local; // deploy locally or on bluemix

const chaincodeIdFile = 'chaincode_id';
const chaincodeIdPath = `${config.chaincode.deployedDir}/${chaincodeIdFile}`;

const ca = config.network.ca[Object.keys(config.network.ca)[0]];
const peer = config.network.peers[0];

const keyValStore = 'keyValStore';
const keyValStorePath = `${config.chaincode.deployedDir}/${keyValStore}${onBluemix ? `-${ca.url.substring(0, 8)}` : ''}`;

/**
 * Setup blockchain data
 * @returns {Promise.<void>}
 */
export default async function setup() {
  try {
    let chaincodeID = loadChaincodeID();

    const chain = hfc.newChain(config.chaincode.projectName);
    chain.setKeyValStore(hfc.newFileKeyValStore(keyValStorePath));

    if (onBluemix) {
      setupBluemix(chain);
    } else {
      setupLocal(chain);
    }

    const { webAppAdmin } = config.chaincode;

    const webUser = await enroll(chain, webAppAdmin.enrollId, webAppAdmin.enrollSecret);

    chain.setRegistrar(webUser);

    // registerUsers()

    chaincodeID = await deployChaincode(webUser, chaincodeID);

    return {
      chain,
      chaincodeID,
      webUser,
    };
  } catch (err) {
    console.log('setup blockchain err: ', err);

    return {
      chain: null,
      chaincodeID: null,
      webUser: null,
    };
  }
}

async function deployChaincode(user, chaincodeID, forceRedeploy = false) {
  if (!chaincodeID || forceRedeploy) {
    try {
      const fnc = 'init';
      const args = ['a', '100', 'b', '200'];

      const results = await deploy(user, fnc, args);

      console.log('deployChaincode: ', results);

      return results.chaincodeID;
    } catch (err) {
      console.log('err: ', err);
    }
  } else {
    return chaincodeID;
  }

  return null;
}

function loadChaincodeID() {
  if (process.env.CHAINCODE_ID) {
    return process.env.CHAINCODE_ID;
  }

  if (fs.existsSync(chaincodeIdPath)) {
    return fs.readFileSync(chaincodeIdPath, 'utf8');
  }

  return null;
}

function setupLocal(chain) {
  console.log('Running in local mode');
  chain.setMemberServicesUrl(`grpc://${ca.url}`);
  chain.addPeer(`grpc://${peer.discovery_host}:${peer.discovery_port}`);

  console.log('ca: ', `grpc://${ca.url}`);
  console.log('peer: ', `grpc://${peer.discovery_host}:${peer.discovery_port}`);
}

function setupBluemix(chain) {
  console.log('Running in bluemix mode');
  const { network } = config;
  const { peers } = network;

  const isHSBN = peers[0].discovery_host.indexOf('secure') >= 0;

  const certFile = isHSBN ? '0.secure.blockchain.ibm.com.cert' : 'us.blockchain.ibm.com.cert';
  const certPath = path.join(__dirname, `/../${config.chaincode.deployedDir}/certificate.pem`);

  fs.createReadStream(certFile).pipe(fs.createWriteStream(certPath));
  const cert = fs.readFileSync(certFile);

  chain.setMemberServicesUrl(`grpc://${ca.url}`, { pem: cert });
  console.log('ca: ', `grpc://${ca.url}`);

  const peerUrls = [];
  const eventUrls = [];

  // Adding all the peers to blockchain
  // this adds high availability for the client
  for (let i = 0; i < peers.length; i++) {
    // Peers on Bluemix require secured connections, hence 'grpcs://'
    peerUrls.push(`grpcs://${peers[i].discovery_host}:${peers[i].discovery_port}`);
    console.log('peer: ', `grpcs://${peers[i].discovery_host}:${peers[i].discovery_port}`);
    chain.addPeer(peerUrls[i], {
      pem: cert,
    });
    eventUrls.push(`grpcs://${peers[i].event_host}:${peers[i].event_port}`);
    chain.eventHubConnect(eventUrls[0], {
      pem: cert,
    });
  }

  process.on('exit', () => {
    chain.eventHubDisconnect();
  });
}
