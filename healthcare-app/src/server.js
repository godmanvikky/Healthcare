import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import connectDB from './config/db.js';
import { typeDefs } from './schema/index.js';
import { resolvers } from './resolvers/index.js';
import { protect } from './middleware/authMiddleware.js';
import client from 'prom-client';

(async () => {
  try {
    console.log('🛠️ Connecting to Database...');
    await connectDB();
    console.log('✅ Database Connected');

    const app = express();

    // Middleware to log incoming request headers
    app.use((req, res, next) => {
      console.log('🔑 Incoming Request Headers:', req.headers.authorization);
      next();
    });

    // ✅ Prometheus Metrics Setup
    const collectDefaultMetrics = client.collectDefaultMetrics;
    collectDefaultMetrics();

    // Custom Prometheus Metrics
    const httpRequestDuration = new client.Histogram({
      name: 'http_request_duration_seconds',
      help: 'Histogram of HTTP request durations',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.1, 0.3, 0.5, 1, 1.5, 2, 3],
    });

    app.use((req, res, next) => {
      const end = httpRequestDuration.startTimer();
      res.on('finish', () => {
        end({ method: req.method, route: req.path, status_code: res.statusCode });
      });
      next();
    });

    // Expose Prometheus Metrics Endpoint
    app.get('/metrics', async (req, res) => {
      try {
        res.set('Content-Type', client.register.contentType);
        res.end(await client.register.metrics());
      } catch (err) {
        res.status(500).end(err);
      }
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

    // Start the server
    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
      console.log(`🚀 Apollo Server running at http://localhost:${PORT}/api/graphql`);
      console.log(`📊 Prometheus metrics available at http://localhost:${PORT}/metrics`);
    });
  } catch (error) {
    console.error('❌ Server Startup Error:', error.message);
    process.exit(1);
  }
})();
