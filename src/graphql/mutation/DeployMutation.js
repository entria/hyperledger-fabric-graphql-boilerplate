import {
  GraphQLString,
  GraphQLNonNull,
  GraphQLList,
} from 'graphql';
import {
  mutationWithClientMutationId,
} from 'graphql-relay';
import { deploy } from '../../blockchain/helpers';

export default mutationWithClientMutationId({
  name: 'DeployMutation',
  description: 'Deploy a new chaincode with following arguments',
  inputFields: {
    fcn: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'function name to be invoked',
    },
    args: {
      type: new GraphQLList(GraphQLString),
      description: 'args of this function',
    },
  },
  mutateAndGetPayload: async ({ fcn, args }, { webUser }) => {
    console.log('deploy: ', fcn, args, webUser.name);

    const results = await deploy(webUser, fcn, args);

    console.log('results: ', results);

    return {
      results: results.chaincodeID,
    };
  },
  outputFields: {
    results: {
      type: GraphQLString,
      resolve: ({ results }) => results,
    },
  },
});

