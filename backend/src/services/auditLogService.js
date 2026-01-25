/**
 * Audit Log Service
 * FAZ 10: Admin & Control Layer
 * 
 * Tüm admin işlemlerini loglar
 * Explicit ve auditable admin actions
 */

const pool = require('../config/database');

class AuditLogService {
  /**
   * Admin action'ı loglar
   * 
   * IMMUTABLE LOG RULES:
   * - Logs are read-only after write
   * - No UPDATE or DELETE allowed
   * - Complete audit trail preserved
   * 
   * @param {Object} params - Log parametreleri
   * @param {string} params.adminId - Admin ID (who)
   * @param {string} params.action - Action tipi (what) - update_campaign_type, pin_campaign, etc.
   * @param {string} params.entityType - Entity tipi (campaign, source, etc.)
   * @param {string} params.entityId - Entity ID (target)
   * @param {Object} params.oldValue - Eski değer (before_state)
   * @param {Object} params.newValue - Yeni değer (after_state)
   * @param {string} params.reason - Değişiklik nedeni (opsiyonel)
   * @param {Object} params.metadata - Ek metadata (opsiyonel)
   * @param {string} params.ipAddress - IP address (opsiyonel)
   * @param {string} params.userAgent - User agent (opsiyonel)
   * @returns {Promise<Object>} Log kaydı
   */
  static async logAdminAction({
    adminId,
    action,
    entityType,
    entityId,
    oldValue = null,
    newValue = null,
    reason = null,
    metadata = null,
    ipAddress = null,
    userAgent = null,
  }) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Audit log tablosu yoksa oluştur (migration'da da olabilir)
      await client.query(`
        CREATE TABLE IF NOT EXISTS admin_audit_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          admin_id VARCHAR(255) NOT NULL,
          action VARCHAR(100) NOT NULL,
          entity_type VARCHAR(50) NOT NULL,
          entity_id UUID NOT NULL,
          old_value JSONB,
          new_value JSONB,
          reason TEXT,
          metadata JSONB,
          created_at TIMESTAMP DEFAULT NOW(),
          ip_address VARCHAR(45),
          user_agent TEXT
        )
      `);
      
      // Index'ler
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON admin_audit_logs(admin_id);
        CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON admin_audit_logs(entity_type, entity_id);
        CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON admin_audit_logs(action);
        CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON admin_audit_logs(created_at);
      `);
      
      // Log kaydı ekle (immutable - no UPDATE/DELETE after insert)
      // before_state ve after_state old_value ve new_value'ya ek olarak saklanır
      const beforeState = oldValue || null;
      const afterState = newValue || null;
      
      const result = await client.query(`
        INSERT INTO admin_audit_logs (
          admin_id,
          action,
          entity_type,
          entity_id,
          old_value,
          new_value,
          before_state,
          after_state,
          reason,
          metadata,
          ip_address,
          user_agent
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `, [
        adminId,
        action,
        entityType,
        entityId,
        oldValue ? JSON.stringify(oldValue) : null,
        newValue ? JSON.stringify(newValue) : null,
        beforeState ? JSON.stringify(beforeState) : null,
        afterState ? JSON.stringify(afterState) : null,
        reason,
        metadata ? JSON.stringify(metadata) : null,
        ipAddress,
        userAgent,
      ]);
      
      await client.query('COMMIT');
      
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Audit log error:', error);
      // Audit log hatası admin action'ı engellemez
      // Sadece log edilir
      return null;
    } finally {
      client.release();
    }
  }
  
  /**
   * Audit log'ları getirir
   * 
   * @param {Object} filters - Filtreleme parametreleri
   * @param {string} filters.adminId - Admin ID (opsiyonel)
   * @param {string} filters.action - Action tipi (opsiyonel)
   * @param {string} filters.entityType - Entity tipi (opsiyonel)
   * @param {string} filters.entityId - Entity ID (opsiyonel)
   * @param {number} filters.limit - Limit (default: 100)
   * @param {number} filters.offset - Offset (default: 0)
   * @returns {Promise<Array>} Audit log kayıtları
   */
  static async getAuditLogs(filters = {}) {
    const {
      adminId = null,
      action = null,
      entityType = null,
      entityId = null,
      limit = 100,
      offset = 0,
    } = filters;
    
    let query = 'SELECT * FROM admin_audit_logs WHERE 1=1';
    const params = [];
    let paramIndex = 1;
    
    if (adminId) {
      query += ` AND admin_id = $${paramIndex}`;
      params.push(adminId);
      paramIndex++;
    }
    
    if (action) {
      query += ` AND action = $${paramIndex}`;
      params.push(action);
      paramIndex++;
    }
    
    if (entityType) {
      query += ` AND entity_type = $${paramIndex}`;
      params.push(entityType);
      paramIndex++;
    }
    
    if (entityId) {
      query += ` AND entity_id = $${paramIndex}`;
      params.push(entityId);
      paramIndex++;
    }
    
    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    return result.rows.map(row => ({
      ...row,
      old_value: row.old_value ? JSON.parse(row.old_value) : null,
      new_value: row.new_value ? JSON.parse(row.new_value) : null,
      before_state: row.before_state ? JSON.parse(row.before_state) : null,
      after_state: row.after_state ? JSON.parse(row.after_state) : null,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
    }));
  }
}

module.exports = AuditLogService;
