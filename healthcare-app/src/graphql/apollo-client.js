import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  split,
} from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';

// ✅ HTTP Link for Queries and Mutations
const httpLink = new HttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_API || 'http://localhost:3000/api/graphql',
});

// ✅ WebSocket Link for Subscriptions
const wsLink =
  typeof window !== 'undefined'
    ? new GraphQLWsLink(
        createClient({
          url: process.env.NEXT_PUBLIC_GRAPHQL_WS_API || 'ws://localhost:4001/api/graphql-subscriptions',
          connectionParams: () => {
            const token = localStorage.getItem('token');
            console.log('🔑 Sending Token via WebSocket:', token);
            return {
              Authorization: token ? `Bearer ${token}` : null,
            };
          },
          on: {
            connected: () => console.log('✅ WebSocket Connected'),
            closed: () => console.log('🔌 WebSocket Disconnected'),
            error: (err) => console.error('❌ WebSocket Error:', err),
          },
        })
      )
    : null;

// ✅ Split Link to Differentiate Between Queries/Mutations and Subscriptions
const splitLink =
  typeof window !== 'undefined'
    ? split(
        ({ query }) => {
          const definition = getMainDefinition(query);
          return (
            definition.kind === 'OperationDefinition' &&
            definition.operation === 'subscription'
          );
        },
        wsLink,
        httpLink
      )
    : httpLink;

// ✅ Apollo Client
const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});

export default client;
