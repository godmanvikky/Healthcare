import { benchmark } from 'graphql-benchmark';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { typeDefs } from './schema/index.js';
import { resolvers } from './resolvers/index.js';

// ✅ Create Executable Schema
const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

// ✅ Define Benchmark Test Cases
const queries = [
  {
    name: 'Get User by ID',
    query: `
      query GetUser {
        getUser(id: "123456") {
          id
          name
          email
        }
      }
    `,
  },
  {
    name: 'Get Appointments by Date',
    query: `
      query GetAppointments {
        getAppointmentsByDate(date: "2024-07-01") {
          id
          patient {
            name
          }
          doctor {
            name
          }
          date
          time
        }
      }
    `,
  },
  {
    name: 'Get Doctors List',
    query: `
      query GetDoctors {
        getDoctors {
          id
          name
          specialization
        }
      }
    `,
  },
];

// ✅ Run Benchmark
(async () => {
  try {
    const results = await benchmark(schema, queries, {
      runs: 100, // Number of runs for each query
    });

    console.log('🚀 Benchmark Results:', results);
  } catch (error) {
    console.error('❌ Benchmark Error:', error.message);
  }
})();
