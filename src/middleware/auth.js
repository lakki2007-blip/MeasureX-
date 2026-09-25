// JWT Authentication and Role-Based Access Control (RBAC) Middleware
const jwt = require('jsonwebtoken');

/**
 * Middleware to verify JWT token and attach authenticated user context to req.user
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided in Authorization header.'
    });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return res.status(401).json({
      success: false,
      message: 'Invalid authorization format. Format must be: Bearer <token>'
    });
  }

  const token = parts[1];
  const secret = process.env.JWT_SECRET || 'measurex_legal_metrology_jwt_secret_key_2026_secure';

  jwt.verify(token, secret, (err, decoded) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Invalid, malformed, or expired token.',
        error: err.message
      });
    }

    // Attach decoded user info: { id, email, role, name, entity }
    req.user = decoded;
    next();
  });
}

/**
 * Middleware factory for Role-Based Access Control (RBAC)
 * Admin has global read/write access. Other roles are checked against allowedRoles.
 * @param  {...string} allowedRoles - e.g. 'trader', 'inspector', 'admin'
 */
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required before role evaluation.'
      });
    }

    const userRole = req.user.role.toLowerCase();

    // Admin has universal global access across the portal
    if (userRole === 'admin') {
      return next();
    }

    const normalizedAllowed = allowedRoles.map(r => r.toLowerCase());
    if (normalizedAllowed.includes(userRole)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Access denied. Role '${req.user.role}' is not authorized for this resource. Required role(s): [${allowedRoles.join(', ')}]`
    });
  };
}

module.exports = {
  authenticateToken,
  authorizeRoles
};
