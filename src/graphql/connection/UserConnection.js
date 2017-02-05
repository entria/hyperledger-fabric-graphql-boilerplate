// @flow

import { connectionDefinitions } from 'graphql-relay';

import UserType from '../type/UserType';

export default connectionDefinitions({
  name: 'User',
  nodeType: UserType,
});
