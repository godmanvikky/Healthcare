// src/server/metrics.js
import client from 'prom-client';

// Create a custom Registry
const register = new client.Registry();

// Collect default system metrics
client.collectDefaultMetrics({ register });

// Define Counters
let graphqlQueryCounter = register.getSingleMetric && register.getSingleMetric('graphql_query_total');
let graphqlMutationCounter = register.getSingleMetric && register.getSingleMetric('graphql_mutation_total');
let graphqlSubscriptionCounter = register.getSingleMetric && register.getSingleMetric('graphql_subscription_total');

if (!graphqlQueryCounter) {
  graphqlQueryCounter = new client.Counter({
    name: 'graphql_query_total',
    help: 'Total number of GraphQL queries made',
    registers: [register],
  });
}

if (!graphqlMutationCounter) {
  graphqlMutationCounter = new client.Counter({
    name: 'graphql_mutation_total',
    help: 'Total number of GraphQL mutations made',
    registers: [register],
  });
}

if (!graphqlSubscriptionCounter) {
  graphqlSubscriptionCounter = new client.Counter({
    name: 'graphql_subscription_total',
    help: 'Total number of GraphQL subscriptions made',
    registers: [register],
  });
}

// Export them
export {
  register,
  graphqlQueryCounter,
  graphqlMutationCounter,
  graphqlSubscriptionCounter
};