import { ApolloClient, InMemoryCache, HttpLink, ApolloLink, concat } from '@apollo/client';

// ✅ Updated GraphQL Server Endpoint
const httpLink = new HttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_API,
});

// ✅ Authorization Middleware
const authMiddleware = new ApolloLink((operation, forward) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token'); // Retrieve token from localStorage
    console.log('🔑 Apollo Client Token:', token);

    operation.setContext(({ headers = {} }) => ({
      headers: {
        ...headers,
        Authorization: token ? `Bearer ${token}` : '',
      },
    }));
  }

  return forward(operation);
});

// ✅ Error Logging Middleware
const errorMiddleware = new ApolloLink((operation, forward) => {
  return forward(operation).map((response) => {
    if (response.errors) {
      console.error('❌ Apollo Client Error:', response.errors);
    }
    return response;
  });
});

// ✅ Apollo Client Instance
const client = new ApolloClient({
  link: concat(authMiddleware, concat(errorMiddleware, httpLink)),
  cache: new InMemoryCache(),
});

export default client;
