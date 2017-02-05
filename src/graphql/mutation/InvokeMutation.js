import {
  GraphQLString,
  GraphQLNonNull,
  GraphQLList,
} from 'graphql';
import {
  mutationWithClientMutationId,
} from 'graphql-relay';
import { invoke } from '../../blockchain/helpers';

export default mutationWithClientMutationId({
  name: 'InvokeMutation',
  description: 'Generic Invoke blockchain mutation',
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
  mutateAndGetPayload: async ({ fcn, args }, { chain, chaincodeID, webUser }) => {
    const invokeRequest = {
      // Name (hash) required for invoke
      chaincodeID,
      // Function to trigger
      fcn,
      // Parameters for the invoke function
      args,
    };

    const results = await invoke(chain, webUser, chaincodeID, invokeRequest);

    console.log('result: ', results);

    return {
      results: results.result,
    };
  },
  outputFields: {
    results: {
      type: GraphQLString,
      resolve: ({ results }) => results,
    },
  },
});
