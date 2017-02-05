// @flow

import {
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import { globalIdField, connectionArgs } from 'graphql-relay';
import { NodeInterface } from '../interface/NodeInterface';

export default new GraphQLObjectType({
  name: 'Airline',
  description: 'Represents Airline',
  fields: () => ({
    id: globalIdField('Airline'),
    _id: {
      type: GraphQLString,
      resolve: obj => obj._id,
    },
    name: {
      type: GraphQLString,
      description: 'Airline Name',
      resolve: obj => obj.name,
    },
    alias: {
      type: GraphQLString,
      description: 'Airline alias',
      resolve: obj => obj.alias,
    },
    iata: {
      type: GraphQLString,
      description: 'Airline code in the IATA scheme',
      resolve: obj => obj.iata,
    },
    icao: {
      type: GraphQLString,
      description: 'Airline code in the ICAO scheme',
      resolve: obj => obj.icao,
    },
    callsign: {
      type: GraphQLString,
      description: 'Airline callsign',
      resolve: obj => obj.callsign,
    },
    country: {
      type: GraphQLString,
      description: 'Airline country',
      resolve: obj => obj.country,
    },
    createdAt: {
      type: GraphQLString,
      description: '',
      resolve: obj => obj.createdAt.toISOString(),
    },
    updatedAt: {
      type: GraphQLString,
      description: '',
      resolve: obj => obj.updatedAt.toISOString(),
    },
  }),
  interfaces: () => [NodeInterface],
});
