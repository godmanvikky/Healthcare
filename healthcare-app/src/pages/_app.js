import React from 'react';
import '../styles/globals.css';
import { ApolloProvider } from '@apollo/client';
import client from '../graphql/apollo-client';
import { AuthProvider } from '../context/AuthContext';

const MyApp=({ Component, pageProps })=> {
  return (
    <ApolloProvider client={client}>
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </ApolloProvider>
  );
}

export default MyApp;
