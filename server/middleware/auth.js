import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// Middleware to authenticate requests
export const authenticate = (req, res, next) => {
  try {
    // Check if login is disabled (for testing)
    if (process.env.ENABLE_LOGIN === 'false') {
      // Create a mock admin user for testing (allows access to all features)
      req.user = {
        id: 1,
        email: 'admin@demo.com',
        role: 'admin'
      };
      return next();
    }

    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret_change_this');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Middleware to check if user is admin
export const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};
