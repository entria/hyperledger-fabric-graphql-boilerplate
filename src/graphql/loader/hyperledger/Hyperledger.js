/**
 * Dataloaders for Hyperledger blockchain
 * @flow
 */

import AirlineLoader from './AirlineLoader';
import UserLoader from './UserLoader';

export default function createLoaders(webUser, chaincodeID) {
  return {
    user: new UserLoader(webUser, chaincodeID),
    airline: new AirlineLoader(webUser, chaincodeID),
  };
}
