// @flow

import { connectionDefinitions } from 'graphql-relay';

import AirlineType from '../type/AirlineType';

export default connectionDefinitions({
  name: 'Airline',
  nodeType: AirlineType,
});
