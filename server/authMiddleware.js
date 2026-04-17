/**
 * JWT Authentication & Authorization Middleware
 * Handles token generation, verification, and role-based authorization
 */

const jwt = require('jsonwebtoken');

// JWT Secret - should be in environment variable for production
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '14d';

/**
 * Generate JWT token for a user
 * @param {object} user - User object with id, email, role
 * @returns {string} - JWT token
 */
function generateToken(user) {
  const payload = {
    userId: user._id || user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    name: user.name
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

/**
 * Verify JWT token and return payload
 * @param {string} token - JWT token
 * @returns {object|null} - Decoded token or null if invalid
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Middleware to authenticate JWT token from Authorization header
 * Expected format: Authorization: Bearer <token>
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Extract token from "Bearer <token>"

  if (!token) {
    return res.status(401).json({ 
      error: 'Access token required',
      code: 'NO_TOKEN'
    });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ 
      error: 'Invalid or expired token',
      code: 'INVALID_TOKEN'
    });
  }

  // Attach user info to request
  req.user = decoded;
  next();
}

/**
 * Middleware to authorize based on user role
 * @param {string|string[]} requiredRoles - Role(s) allowed
 */
function authorize(requiredRoles) {
  return (req, res, next) => {
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'NOT_AUTHENTICATED'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Admin authentication required.',
        code: 'FORBIDDEN',
        requiredRole: roles.join(' or ')
      });
    }

    next();
  };
}

module.exports = { 
  generateToken, 
  verifyToken, 
  authenticateToken, 
  authorize,
  JWT_SECRET,
  JWT_EXPIRY
};
