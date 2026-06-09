import { ApolloClient, InMemoryCache, createHttpLink, split } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';
import * as SecureStore from 'expo-secure-store';

// Update with your machine's local IP when testing on a real device
const SERVER_HOST = 'localhost';
const HTTP_URL = `http://${SERVER_HOST}:4000/graphql`;
const WS_URL = `ws://${SERVER_HOST}:4000/graphql`;

const httpLink = createHttpLink({ uri: HTTP_URL });

const authLink = setContext(async (_, { headers }) => {
  const token = await SecureStore.getItemAsync('hc_token');
  return { headers: { ...headers, authorization: token ? `Bearer ${token}` : '' } };
});

const wsLink = new GraphQLWsLink(
  createClient({
    url: WS_URL,
    connectionParams: async () => {
      const token = await SecureStore.getItemAsync('hc_token');
      return { Authorization: token ? `Bearer ${token}` : '' };
    },
  })
);

const splitLink = split(
  ({ query }) => {
    const def = getMainDefinition(query);
    return def.kind === 'OperationDefinition' && def.operation === 'subscription';
  },
  wsLink,
  authLink.concat(httpLink)
);

export const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});
