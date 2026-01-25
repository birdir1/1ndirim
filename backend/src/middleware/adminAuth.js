/**
 * Admin Authentication Middleware
 * FAZ 10: Admin & Control Layer
 * 
 * Admin işlemleri için authentication ve authorization
 * Bot logic'ten tamamen izole
 * 
 * Authentication Methods:
 * 1. API Key (development only)
 * 2. Email-based (production, from admin_users table)
 * 
 * Roles:
 * - super_admin: Full access
 * - editor: Can modify campaigns
 * - viewer: Read-only access
 */

const pool = require('../config/database');

/**
 * Admin authentication middleware
 * Admin işlemleri için gerekli authentication kontrolü
 * 
 * Authentication Methods:
 * 1. API Key (development only) - Backward compatibility
 * 2. Email header (production) - From admin_users table
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
async function requireAdmin(req, res, next) {
  try {
    const adminApiKey = req.headers['x-admin-api-key'];
    const adminEmail = req.headers['x-admin-email'];
    
    // Method 1: API Key (development only, backward compatibility)
    if (process.env.NODE_ENV === 'development' && adminApiKey) {
      const validApiKey = process.env.ADMIN_API_KEY || 'dev-admin-key';
      if (adminApiKey === validApiKey) {
        // Development mode: Use default admin user
        req.admin = {
          id: 'admin-dev',
          email: 'dev@admin.local',
          role: 'super_admin',
          name: 'Development Admin',
        };
        return next();
      }
    }
    
    // Method 2: Email-based authentication (production)
    if (adminEmail) {
      const email = adminEmail.trim().toLowerCase();
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid email format',
          message: 'Please provide a valid email address',
        });
      }
      
      // Lookup admin user from database
      const result = await pool.query(
        `SELECT id, email, role, is_active 
         FROM admin_users 
         WHERE email = $1`,
        [email]
      );
      
      if (result.rows.length === 0) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Admin user not found',
        });
      }
      
      const adminUser = result.rows[0];
      
      // Check if admin is active
      if (!adminUser.is_active) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Admin account is inactive',
        });
      }
      
      // Set admin info in request
      req.admin = {
        id: adminUser.id,
        email: adminUser.email,
        role: adminUser.role,
        name: adminUser.email.split('@')[0], // Use email prefix as name
      };
      
      return next();
    }
    
    // No valid authentication method found
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Admin authentication required. Provide x-admin-api-key (dev) or x-admin-email (production)',
    });
  } catch (error) {
    console.error('Admin authentication error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication error',
      message: 'An error occurred during authentication',
    });
  }
}

/**
 * Admin role check middleware
 * Belirli admin rolleri için kontrol
 * 
 * @param {Array<string>} allowedRoles - İzin verilen roller
 */
function requireAdminRole(allowedRoles = ['super_admin']) {
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
        requiredRoles: allowedRoles,
        currentRole: req.admin.role,
      });
    }
    
    next();
  };
}

/**
 * Require super_admin or editor role
 * Campaign modification operations require this
 * 
 * @returns {Function} Express middleware
 */
function requireSuperAdminOrEditor() {
  return requireAdminRole(['super_admin', 'editor']);
}

/**
 * Require viewer or above (all roles)
 * Read operations allow all authenticated admins
 * 
 * @returns {Function} Express middleware
 */
function requireViewerOrAbove() {
  return requireAdminRole(['super_admin', 'editor', 'viewer']);
}

module.exports = {
  requireAdmin,
  requireAdminRole,
  requireSuperAdminOrEditor,
  requireViewerOrAbove,
};
