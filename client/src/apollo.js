import { ApolloClient, InMemoryCache, createHttpLink, split } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';

// In production: set REACT_APP_API_URL in Netlify environment variables
// e.g. REACT_APP_API_URL=https://api.hobbyorigin.com
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000';

const httpUrl = `${API_BASE}/graphql`;
const wsUrl = httpUrl.replace(/^https?/, (p) => (p === 'https' ? 'wss' : 'ws'));

const httpLink = createHttpLink({ uri: httpUrl });

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('hc_token');
  return { headers: { ...headers, authorization: token ? `Bearer ${token}` : '' } };
});

const wsLink = new GraphQLWsLink(
  createClient({
    url: wsUrl,
    connectionParams: () => {
      const token = localStorage.getItem('hc_token');
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
  cache: new InMemoryCache({
    typePolicies: {
      Group: {
        fields: {
          messages: { merge: (_, incoming) => incoming },
          members: { merge: (_, incoming) => incoming },
        },
      },
    },
  }),
});
