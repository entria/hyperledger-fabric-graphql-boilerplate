import {
  GraphQLString,
  GraphQLNonNull,
  GraphQLList,
} from 'graphql';
import {
  mutationWithClientMutationId,
} from 'graphql-relay';
import mongoose from 'mongoose';
import { invoke } from '../../../blockchain/helpers';
import { User } from '../../model';

const { ObjectId } = mongoose.Types;

export default mutationWithClientMutationId({
  name: 'UserCreateMutation',
  description: 'UserCreate using invoke api under the hood',
  inputFields: {
    name: {
      type: new GraphQLNonNull(GraphQLString),
    },
    password: {
      type: new GraphQLNonNull(GraphQLString),
    },
    email: {
      type: new GraphQLNonNull(GraphQLString),
    },
    passport: {
      type: GraphQLString,
      description: 'user passport',
    },
  },
  mutateAndGetPayload: async ({ name, password, email, passport }, { chain, chaincodeID, webUser }) => {
    // Create new record on mongo
    const newUser = await new User({
      name,
      password,
      email,
      passport,
    }).save();


    const invokeRequest = {
      // Name (hash) required for invoke
      chaincodeID,
      // Function to trigger
      fcn: 'UserCreate',
      // Parameters for the invoke function
      args: [newUser._id.toString(), name, passport],
    };

    console.log('invoke: ', invokeRequest);

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
