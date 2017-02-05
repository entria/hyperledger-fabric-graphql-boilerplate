// @flow

import { nodeDefinitions, fromGlobalId } from 'graphql-relay';

const {
  nodeField,
  nodeInterface,
} = nodeDefinitions(
  // A method that maps from a global id to an object
  async (globalId, { user }) => {
    const { id, type } = fromGlobalId(globalId);

    // TODO implement this
  },
  // A method that maps from an object to a type
  (obj) => {
    // TODO implement this
  },
);

export const NodeInterface = nodeInterface;
export const NodeField = nodeField;
