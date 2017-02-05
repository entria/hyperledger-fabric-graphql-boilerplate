import {
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';

export default new GraphQLObjectType({
  name: 'UserHyperledger',
  description: 'Represents UserType',
  fields: () => ({
    Id: {
      type: GraphQLString,
      description: 'id of user in the blockchain',
      resolve: obj => obj.Id,
    },
    Name: {
      type: GraphQLString,
      description: 'name of user in the blockchain',
      resolve: obj => obj.Name,
    },
  }),
});
