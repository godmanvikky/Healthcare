import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const protect = async (reqOrContext) => {
  let token;

  // ✅ Handle HTTP Authorization Header
  if (reqOrContext.headers?.authorization && reqOrContext.headers.authorization.startsWith('Bearer')) {
    token = reqOrContext.headers.authorization.split(' ')[1];
  }

  // ✅ Handle WebSocket Authorization in `connectionParams`
  if (reqOrContext.Authorization && reqOrContext.Authorization.startsWith('Bearer')) {
    token = reqOrContext.Authorization.split(' ')[1];
  }

  console.log('🔑 Extracted Token:', token);

  if (!token) {
    throw new Error('Not authorized, no token');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Decoded Token:', decoded);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      throw new Error('User not found');
    }

    console.log('✅ User Authenticated:', user);

    return user; // Return the authenticated user
  } catch (error) {
    console.error('❌ Token verification failed:', error.message);
    throw new Error('Not authorized, token failed');
  }
};

export { protect };
