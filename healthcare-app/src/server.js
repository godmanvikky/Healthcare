import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import connectDB from './config/db.js';
import { typeDefs } from './schema/index.js';
import { resolvers } from './resolvers/index.js';
import { protect } from './middleware/authMiddleware.js';

(async () => {
  try {
    console.log('🛠️ Connecting to Database...');
    await connectDB();
    console.log('✅ Database Connected');

    const app = express();

    // Debug Middleware to log headers
    app.use((req, res, next) => {
      console.log('🔑 Incoming Request Headers:', req.headers.authorization);
      next();
    });

    const server = new ApolloServer({
      typeDefs,
      resolvers,
      context: async ({ req }) => {
        console.log('🔑 Context Headers:', req.headers.authorization);
        try {
          const user = await protect(req);
          console.log('🛡️ Authenticated User:', user);
          return { user };
        } catch (error) {
          console.warn('🛑 Authentication failed:', error.message);
          return { user: null };
        }
      },
    });

    await server.start();
    server.applyMiddleware({ app, path: '/api/graphql' });

    // Run Apollo Server on Port 4000
    console.log(process.env.PORT)
    app.listen( process.env.PORT, () => {
      console.log('🚀 Apollo Server running at http://localhost:4000/api/graphql');
    });
  } catch (error) {
    console.error('❌ Server Startup Error:', error.message);
    process.exit(1);
  }
})();
