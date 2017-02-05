import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLList,
  GraphQLNonNull,
} from 'graphql';
import { globalIdField } from 'graphql-relay';

import UserHyperledgerType from './UserHyperledgerType';
import AirlineType from './AirlineType';

export default new GraphQLObjectType({
  name: 'Hyperledger',
  description: 'Represents Hyperledger',
  fields: () => ({
    id: globalIdField('Hyperledger'),
    users: {
      type: new GraphQLList(UserHyperledgerType),
      resolve: async (obj, args, { hpLoaders }) => {
        return hpLoaders.user.loadUsers();
      },
    },
    user: {
      type: UserHyperledgerType,
      args: {
        id: {
          type: new GraphQLNonNull(GraphQLString),
        },
      },
      resolve: async (obj, { id }, { hpLoaders }) => {
        return hpLoaders.user.load(id);
      },
    },

    airline: {
      type: AirlineType,
      args: {
        id: {
          type: new GraphQLNonNull(GraphQLString),
        },
      },
      resolve: async (obj, { id }, { hpLoaders }) => {
        return await hpLoaders.airline.load(id);
      },
    },

    airlines: {
      type: new GraphQLList(AirlineType),
      resolve: async (obj, args, { hpLoaders }) => {
        return await hpLoaders.airline.loadAirlines();
      },
    },
  }),
});
