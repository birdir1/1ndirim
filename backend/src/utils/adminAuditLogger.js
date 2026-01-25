/**
 * Admin Audit Logger Helper
 * FAZ 10: Admin & Control Layer
 * 
 * Automatic logging helper for admin actions
 * Ensures all admin actions are logged with complete audit trail
 */

const AuditLogService = require('../services/auditLogService');

/**
 * Logger helper for admin actions
 * Automatically logs admin actions with complete context
 * 
 * @param {Object} params - Log parameters
 * @param {Object} params.admin - Admin object (from req.admin)
 * @param {string} params.action - Action type
 * @param {string} params.entityType - Entity type
 * @param {string} params.entityId - Entity ID
 * @param {Object} params.beforeState - Before state (old value)
 * @param {Object} params.afterState - After state (new value)
 * @param {string} params.reason - Reason for action
 * @param {Object} params.metadata - Additional metadata
 * @param {Object} params.req - Express request object (optional, for IP/user agent)
 * @returns {Promise<Object>} Log record
 */
async function logAdminAction({
  admin,
  action,
  entityType,
  entityId,
  beforeState = null,
  afterState = null,
  reason = null,
  metadata = null,
  req = null,
}) {
  if (!admin || !admin.id) {
    console.warn('⚠️ Audit log: Admin information missing');
    return null;
  }
  
  // Extract IP address and user agent from request if available
  const ipAddress = req ? (req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress) : null;
  const userAgent = req ? req.headers['user-agent'] : null;
  
  // Merge admin info into metadata
  const enhancedMetadata = {
    ...metadata,
    admin_name: admin.name || admin.email,
    admin_role: admin.role,
    timestamp: new Date().toISOString(),
  };
  
  try {
    const logRecord = await AuditLogService.logAdminAction({
      adminId: admin.id,
      action,
      entityType,
      entityId,
      oldValue: beforeState,
      newValue: afterState,
      reason,
      metadata: enhancedMetadata,
      ipAddress,
      userAgent,
    });
    
    return logRecord;
  } catch (error) {
    // Audit log errors should not break admin actions
    // But we should log them for monitoring
    console.error('❌ Audit log error (non-blocking):', error);
    return null;
  }
}

/**
 * Logger helper specifically for campaign actions
 * Convenience wrapper for campaign-related logging
 * 
 * @param {Object} params - Log parameters
 * @param {Object} params.admin - Admin object
 * @param {string} params.action - Action type
 * @param {string} params.campaignId - Campaign ID
 * @param {Object} params.beforeState - Before state
 * @param {Object} params.afterState - After state
 * @param {string} params.reason - Reason
 * @param {Object} params.metadata - Additional metadata
 * @param {Object} params.req - Express request object
 * @returns {Promise<Object>} Log record
 */
async function logCampaignAction({
  admin,
  action,
  campaignId,
  beforeState = null,
  afterState = null,
  reason = null,
  metadata = null,
  req = null,
}) {
  return logAdminAction({
    admin,
    action,
    entityType: 'campaign',
    entityId: campaignId,
    beforeState,
    afterState,
    reason,
    metadata,
    req,
  });
}

module.exports = {
  logAdminAction,
  logCampaignAction,
};
