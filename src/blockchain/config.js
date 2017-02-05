// Get config from bluemix or local
import credentials from '../../ServiceCredentials.json';

const adminUser = credentials.users.filter(
  user => user.enrollId === 'WebAppAdmin')[0];

// bluemix config
export const bluemix = {
  network: {
    peers: credentials.peers,
    ca: credentials.ca,
    users: credentials.users,
  },
  chaincode: {
    projectName: 'build-chaincode',
    deployedDir: 'deploy/bluemix',
    webAppAdmin: {
      enrollId: adminUser.enrollId,
      enrollSecret: adminUser.enrollSecret,
    },
  },
  cert: credentials.cert,
};

// Docker-compose config
export const local = {
  network: {
    peers: [
      {
        discovery_host: 'localhost',
        discovery_port: 7051,
      },
    ],
    ca: {
      ca: {
        url: 'localhost:7054',
      },
    },
  },
  chaincode: {
    projectName: 'build-chaincode', // src/build-chaincode/chaincode.go
    deployedDir: 'deploy/local',
    webAppAdmin: {
      enrollId: 'WebAppAdmin',
      enrollSecret: 'DJY27pEnl16d',
    },
  },
};
