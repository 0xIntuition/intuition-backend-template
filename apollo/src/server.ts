import { ApolloServer } from 'apollo-server';
import gql from 'graphql-tag';

const typeDefs = gql`
  type Follower {
    id: String!
  }
  type Query {
    followers(account: ID!): [Follower!]!
  }
`;

const resolvers = {
  Query: {
    followers(parent, args, contextValue, info) {
      // this would be a database query (memgraph)
      return [
        { id: "\\x7fd828e603826d4b1f66578e76810bfa2080e4d0" },
        { id: "\\x9b513c33f5118392fc809e979c8987ee6cdeef0e" },
      ];
    },
  },
};

const server = new ApolloServer({ typeDefs, resolvers });

server.listen().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});
