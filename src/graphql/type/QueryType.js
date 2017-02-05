// @flow

import { GraphQLObjectType } from 'graphql';
import { NodeField } from '../interface/NodeInterface';

import HyperledgerType from './HyperledgerType';

export default new GraphQLObjectType({
  name: 'Query',
  description: 'The root of all... queries',
  fields: () => ({
    node: NodeField,
    hyperledger: {
      type: HyperledgerType,
      args: {},
      resolve: () => ({}),
    },
  }),
});
