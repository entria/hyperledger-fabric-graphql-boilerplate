// @flow

import {
  GraphQLObjectType,
} from 'graphql';

import Invoke from '../mutation/InvokeMutation';
import Deploy from '../mutation/DeployMutation';

import HPUserCreate from '../mutation/hyperledger/UserCreateMutation';

export default new GraphQLObjectType({
  name: 'Mutation',
  fields: () => ({
    Invoke,
    Deploy,

    // HyperLedger
    HPUserCreate,
  }),
});
