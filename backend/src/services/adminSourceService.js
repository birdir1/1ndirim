/**
 * Admin Source Service
 * FAZ 10: Admin & Control Layer
 * 
 * Admin-only source management operations
 * Source status management (active, backlog, hard_backlog)
 */

const pool = require('../config/database');
const Source = require('../models/Source');
const AuditLogService = require('./auditLogService');

class AdminSourceService {
  /**
   * Source status'ü günceller (Admin-only)
   * 
   * @param {string} sourceId - Source ID
   * @param {string} status - Yeni status (active, backlog, hard_backlog)
   * @param {string} reason - Status nedeni (zorunlu)
   * @param {Object} admin - Admin bilgisi
   * @returns {Promise<Object>} Güncellenmiş source
   */
  static async updateSourceStatus(sourceId, status, reason, admin) {
    if (!reason || reason.trim().length === 0) {
      throw new Error('Reason is required for source status update');
    }
    
    const validStatuses = ['active', 'backlog', 'hard_backlog'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid source status: ${status}`);
    }
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Mevcut source'u getir
      const currentSource = await client.query(
        'SELECT * FROM sources WHERE id = $1',
        [sourceId]
      );
      
      if (currentSource.rows.length === 0) {
        throw new Error('Source not found');
      }
      
      const oldSource = currentSource.rows[0];
      const oldStatus = oldSource.source_status || 'active';
      
      // Status'ü güncelle
      const result = await client.query(`
        UPDATE sources
        SET source_status = $1, status_reason = $2, updated_at = NOW()
        WHERE id = $3
        RETURNING *
      `, [status, reason, sourceId]);
      
      const updatedSource = result.rows[0];
      
      // Audit log
      await AuditLogService.logAdminAction({
        adminId: admin.id,
        action: 'update_source_status',
        entityType: 'source',
        entityId: sourceId,
        oldValue: {
          source_status: oldStatus,
          status_reason: oldSource.status_reason,
        },
        newValue: {
          source_status: status,
          status_reason: reason,
        },
        reason: reason,
        metadata: {
          admin_name: admin.name,
          admin_role: admin.role,
          source_name: updatedSource.name,
        },
      });
      
      await client.query('COMMIT');
      
      return updatedSource;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Source detaylarını getirir (Admin-only, tüm status'ler)
   * 
   * @param {string} sourceId - Source ID
   * @returns {Promise<Object>} Source detayı
   */
  static async getSourceDetails(sourceId) {
    const result = await pool.query(
      `SELECT * FROM sources WHERE id = $1`,
      [sourceId]
    );
    
    if (result.rows.length === 0) {
      throw new Error('Source not found');
    }
    
    return result.rows[0];
  }
  
  /**
   * Tüm source'ları getirir (Admin-only, tüm status'ler)
   * 
   * @param {Object} filters - Filtreleme parametreleri
   * @returns {Promise<Array>} Source listesi
   */
  static async getAllSources(filters = {}) {
    const {
      status = null,
      type = null,
      isActive = null,
    } = filters;
    
    let query = 'SELECT * FROM sources WHERE 1=1';
    const params = [];
    let paramIndex = 1;
    
    if (status) {
      query += ` AND source_status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (type) {
      query += ` AND type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }
    
    if (isActive !== null) {
      query += ` AND is_active = $${paramIndex}`;
      params.push(isActive);
      paramIndex++;
    }
    
    query += ` ORDER BY source_status, type, name`;
    
    const result = await pool.query(query, params);
    return result.rows;
  }
}

module.exports = AdminSourceService;
