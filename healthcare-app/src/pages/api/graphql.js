import { ApolloServer } from 'apollo-server-micro';
import connectDB from '../../config/db.js';
import { typeDefs } from '../../schema/index.js';
import { resolvers } from '../../resolvers/index.js';
import { protect } from '../../middleware/authMiddleware.js';
import dotenv from 'dotenv';

dotenv.config();

// ✅ Connect to Database
(async () => {
  try {
    console.log('🛠️ Connecting to Database...');
    await connectDB();
    console.log('✅ Database Connected');
  } catch (error) {
    console.error('❌ Database Connection Failed:', error.message);
    process.exit(1);
  }
})();

// ✅ Apollo Server Initialization
let server;
let serverStarted = false;

const startApolloServer = async () => {
  if (!serverStarted) {
    server = new ApolloServer({
      typeDefs,
      resolvers,
      context: async ({ req }) => {
        console.log('🔑 Incoming Headers:', req.headers.authorization);
        try {
          const user = await protect(req); // Authenticate User
          console.log('🛡️ Authenticated User:', user);
          return { user };
        } catch (error) {
          console.warn('🛑 Authentication failed:', error.message);
          return { user: null };
        }
      },
    });
    await server.start();
    serverStarted = true;
    console.log('🚀 Apollo Server Initialized');
  }
};

// ✅ API Route Handler for Next.js
export default async function handler(req, res) {
  try {
    await startApolloServer();
    await server.createHandler({ path: '/api/graphql' })(req, res);
  } catch (error) {
    console.error('❌ Apollo Server Handler Error:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

// ✅ Disable Body Parsing in Next.js API Routes for Apollo Server
export const config = {
  api: {
    bodyParser: false,
  },
};
