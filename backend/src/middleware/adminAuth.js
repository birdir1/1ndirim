/**
 * Admin Authentication Middleware
 * FAZ 10: Admin & Control Layer
 * 
 * Admin işlemleri için authentication ve authorization
 * Bot logic'ten tamamen izole
 */

/**
 * Admin authentication middleware
 * Admin işlemleri için gerekli authentication kontrolü
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function requireAdmin(req, res, next) {
  // TODO: Implement proper admin authentication
  // For now: API key or JWT token based auth
  // Production'da: JWT token + role-based access control
  
  const adminApiKey = req.headers['x-admin-api-key'];
  const adminToken = req.headers['authorization'];
  
  // Development: API key kontrolü
  if (process.env.NODE_ENV === 'development') {
    const validApiKey = process.env.ADMIN_API_KEY || 'dev-admin-key';
    if (adminApiKey === validApiKey) {
      req.admin = {
        id: 'admin-dev',
        role: 'admin',
        name: 'Development Admin',
      };
      return next();
    }
  }
  
  // Production: JWT token kontrolü (gelecekte implement edilecek)
  if (adminToken) {
    // TODO: JWT token validation
    // const decoded = jwt.verify(adminToken, process.env.JWT_SECRET);
    // req.admin = decoded;
    // return next();
  }
  
  // Unauthorized
  return res.status(401).json({
    success: false,
    error: 'Unauthorized',
    message: 'Admin authentication required',
  });
}

/**
 * Admin role check middleware
 * Belirli admin rolleri için kontrol
 * 
 * @param {Array<string>} allowedRoles - İzin verilen roller
 */
function requireAdminRole(allowedRoles = ['admin']) {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Admin authentication required',
      });
    }
    
    if (!allowedRoles.includes(req.admin.role)) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Insufficient permissions',
      });
    }
    
    next();
  };
}

module.exports = {
  requireAdmin,
  requireAdminRole,
};
