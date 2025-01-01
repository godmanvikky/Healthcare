import { ApolloServer } from 'apollo-server-micro';
import { makeExecutableSchema } from '@graphql-tools/schema';
import depthLimit from 'graphql-depth-limit';
import { typeDefs } from '../../schema/index.js';
import { resolvers } from '../../resolvers/index.js';
import connectDB from '../../config/db.js';
import { protect } from '../../middleware/authMiddleware.js';
import { createLoaders } from '@/loaders/loader.js';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import { createServer } from 'http';
import pubsub from '@/resolvers/pubsub.js';

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

// ✅ Database Connection
(async () => {
  try {
    await connectDB();
    console.log('✅ Database Connected');
  } catch (error) {
    console.error('❌ Database Connection Failed:', error.message);
    process.exit(1);
  }
})();

// ✅ Apollo Server for HTTP Queries and Mutations
let server;
let serverStarted = false;

const startApolloServer = async () => {
  if (!serverStarted) {
    server = new ApolloServer({
      schema,
      validationRules: [
        depthLimit(5, {}, (depths) => {
          console.log('🔍 Query Depth:', depths);
        }),
      ],
      context: async ({ req }) => {
        try {
          const user = await protect(req);
          const loaders = createLoaders();
          return { user, loaders };
        } catch (error) {
          console.warn('🛑 Authentication failed:', error.message);
          return { user: null, loaders: createLoaders() };
        }
      },
    });
    await server.start();
    serverStarted = true;
    console.log('🚀 Apollo HTTP Server Initialized');
  }
};

// ✅ WebSocket Setup for Subscriptions
if (!global.wsServer) {
  const httpServer = createServer();

  global.wsServer = new WebSocketServer({
    server: httpServer,
    path: '/api/graphql-subscriptions',
  });

  useServer(
    {
      schema,
      context: async (ctx) => {
        try {
          const token = ctx.connectionParams?.Authorization || '';
          console.log('🔑 Token from WebSocket Context:', token);
  
          if (!token) {
            throw new Error('No token provided');
          }
  
          // Pass the token to the `protect` middleware
          const user = await protect({ Authorization: token });
          const loaders = createLoaders();
  
          console.log('✅ WebSocket User Authenticated:', user);
          return { user, loaders, pubsub };
        } catch (error) {
          console.warn('🛑 WebSocket Authentication failed:', error.message);
          throw new Error('Not authorized');
        }
      },
      onConnect: () => {
        console.log('✅ WebSocket Connected');
      },
      onDisconnect: () => {
        console.log('🔌 WebSocket Disconnected');
      },
    },
    global.wsServer
  );
  

  httpServer.listen(4001, (req,res) => {
    console.log(res,req)
    console.log('🚀 WebSocket Server running at ws://localhost:4001/api/graphql-subscriptions');
  });
}

// ✅ API Route Handler for HTTP Requests
export default async function handler(req, res) {
  try {
    await startApolloServer();
    await server.createHandler({ path: '/api/graphql' })(req, res);
  } catch (error) {
    console.error('❌ Apollo Server Handler Error:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

// ✅ Disable Body Parsing in Next.js API Routes
export const config = {
  api: {
    bodyParser: false,
  },
};
