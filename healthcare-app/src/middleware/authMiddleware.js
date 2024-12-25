import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const protect = async (req) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('🔑 Decoded Token:', decoded);

      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        throw new Error('User not found');
      }

      return user; // Return the user object
    } catch (error) {
      console.error('❌ Token verification failed:', error.message);
      throw new Error('Not authorized, token failed');
    }
  } else {
    throw new Error('Not authorized, no token');
  }
};

export { protect };
