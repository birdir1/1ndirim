/**
 * Admin Campaign Service
 * FAZ 10: Admin & Control Layer
 * 
 * Admin-only campaign management operations
 * Bot logic'ten tamamen izole
 * Explicit ve auditable actions
 */

const pool = require('../config/database');
const Campaign = require('../models/Campaign');
const AuditLogService = require('./auditLogService');
const { isHighQualityCampaign } = require('../utils/campaignQualityFilter');

class AdminCampaignService {
  /**
   * Campaign type'ı değiştirir (Admin-only, explicit)
   * 
   * KURALLAR:
   * - Main feed'e otomatik promotion YOK
   * - Light/category/low'dan main'e geçiş sadece admin tarafından
   * - Tüm değişiklikler audit edilir
   * 
   * @param {string} campaignId - Campaign ID
   * @param {string} newCampaignType - Yeni campaign type (main, light, category, low)
   * @param {Object} admin - Admin bilgisi
   * @param {string} reason - Değişiklik nedeni (zorunlu)
   * @returns {Promise<Object>} Güncellenmiş campaign
   */
  static async changeCampaignType(campaignId, newCampaignType, admin, reason) {
    if (!reason || reason.trim().length === 0) {
      throw new Error('Reason is required for campaign type change');
    }
    
    const validTypes = ['main', 'light', 'category', 'low'];
    if (!validTypes.includes(newCampaignType)) {
      throw new Error(`Invalid campaign type: ${newCampaignType}`);
    }
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Mevcut campaign'i getir
      const currentCampaign = await client.query(
        'SELECT * FROM campaigns WHERE id = $1',
        [campaignId]
      );
      
      if (currentCampaign.rows.length === 0) {
        throw new Error('Campaign not found');
      }
      
      const oldCampaign = currentCampaign.rows[0];
      const oldCampaignType = oldCampaign.campaign_type;
      
      // Aynı type'a değiştirme kontrolü
      if (oldCampaignType === newCampaignType) {
        await client.query('ROLLBACK');
        throw new Error(`Campaign is already ${newCampaignType}`);
      }
      
      // Main feed protection: Light/category/low'dan main'e geçiş özel kontrol
      if (newCampaignType === 'main') {
        // Main feed'e geçiş için ekstra validation
        // Value bilgisi olmalı ve kalite filtresinden geçmeli
        const campaignForCheck = {
          title: oldCampaign.title,
          description: oldCampaign.description,
          originalUrl: oldCampaign.original_url,
        };
        
        if (!isHighQualityCampaign(campaignForCheck)) {
          await client.query('ROLLBACK');
          throw new Error('Cannot promote to main feed: Campaign does not pass quality filter');
        }
      }
      
      // Campaign type'ı güncelle
      const updateFields = [];
      const updateValues = [];
      let paramIndex = 1;
      
      updateFields.push(`campaign_type = $${paramIndex}`);
      updateValues.push(newCampaignType);
      paramIndex++;
      
      // Feed flags'leri güncelle
      if (newCampaignType === 'light') {
        updateFields.push(`show_in_light_feed = $${paramIndex}`);
        updateValues.push(true);
        paramIndex++;
        updateFields.push(`show_in_category_feed = $${paramIndex}`);
        updateValues.push(false);
        paramIndex++;
      } else if (newCampaignType === 'category') {
        updateFields.push(`show_in_light_feed = $${paramIndex}`);
        updateValues.push(false);
        paramIndex++;
        updateFields.push(`show_in_category_feed = $${paramIndex}`);
        updateValues.push(true);
        paramIndex++;
      } else if (newCampaignType === 'main') {
        updateFields.push(`show_in_light_feed = $${paramIndex}`);
        updateValues.push(false);
        paramIndex++;
        updateFields.push(`show_in_category_feed = $${paramIndex}`);
        updateValues.push(false);
        paramIndex++;
      } else if (newCampaignType === 'low') {
        // Low value: Feed flags değişmez, sadece value_level güncellenir
        updateFields.push(`value_level = $${paramIndex}`);
        updateValues.push('low');
        paramIndex++;
      }
      
      updateFields.push(`updated_at = NOW()`);
      updateValues.push(campaignId);
      
      const updateQuery = `
        UPDATE campaigns
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;
      
      const result = await client.query(updateQuery, updateValues);
      const updatedCampaign = result.rows[0];
      
      // Audit log
      await AuditLogService.logAdminAction({
        adminId: admin.id,
        action: 'update_campaign_type',
        entityType: 'campaign',
        entityId: campaignId,
        oldValue: {
          campaign_type: oldCampaignType,
          show_in_light_feed: oldCampaign.show_in_light_feed,
          show_in_category_feed: oldCampaign.show_in_category_feed,
        },
        newValue: {
          campaign_type: newCampaignType,
          show_in_light_feed: updatedCampaign.show_in_light_feed,
          show_in_category_feed: updatedCampaign.show_in_category_feed,
        },
        reason: reason,
        metadata: {
          admin_name: admin.name,
          admin_role: admin.role,
        },
      });
      
      await client.query('COMMIT');
      
      return updatedCampaign;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Campaign'i pin'ler/unpin'ler (Admin-only)
   * 
   * @param {string} campaignId - Campaign ID
   * @param {boolean} isPinned - Pin durumu
   * @param {Object} admin - Admin bilgisi
   * @param {string} reason - Pin/unpin nedeni (opsiyonel)
   * @returns {Promise<Object>} Güncellenmiş campaign
   */
  static async togglePin(campaignId, isPinned, admin, reason = null) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // is_pinned kolonu yoksa ekle (migration'da da olabilir)
      await client.query(`
        ALTER TABLE campaigns 
        ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false
      `);
      
      // Mevcut campaign'i getir
      const currentCampaign = await client.query(
        'SELECT * FROM campaigns WHERE id = $1',
        [campaignId]
      );
      
      if (currentCampaign.rows.length === 0) {
        throw new Error('Campaign not found');
      }
      
      const oldCampaign = currentCampaign.rows[0];
      const oldIsPinned = oldCampaign.is_pinned || false;
      
      // Pin durumunu güncelle
      const result = await client.query(`
        UPDATE campaigns
        SET is_pinned = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `, [isPinned, campaignId]);
      
      const updatedCampaign = result.rows[0];
      
      // Audit log
      await AuditLogService.logAdminAction({
        adminId: admin.id,
        action: isPinned ? 'pin_campaign' : 'unpin_campaign',
        entityType: 'campaign',
        entityId: campaignId,
        oldValue: { is_pinned: oldIsPinned },
        newValue: { is_pinned: isPinned },
        reason: reason || (isPinned ? 'Campaign pinned by admin' : 'Campaign unpinned by admin'),
        metadata: {
          admin_name: admin.name,
          admin_role: admin.role,
        },
      });
      
      await client.query('COMMIT');
      
      return updatedCampaign;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Campaign'i aktif/pasif yapar (Admin-only)
   * 
   * @param {string} campaignId - Campaign ID
   * @param {boolean} isActive - Aktif durumu
   * @param {Object} admin - Admin bilgisi
   * @param {string} reason - Değişiklik nedeni (zorunlu)
   * @returns {Promise<Object>} Güncellenmiş campaign
   */
  static async toggleActive(campaignId, isActive, admin, reason) {
    if (!reason || reason.trim().length === 0) {
      throw new Error('Reason is required for active status change');
    }
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Mevcut campaign'i getir
      const currentCampaign = await client.query(
        'SELECT * FROM campaigns WHERE id = $1',
        [campaignId]
      );
      
      if (currentCampaign.rows.length === 0) {
        throw new Error('Campaign not found');
      }
      
      const oldCampaign = currentCampaign.rows[0];
      const oldIsActive = oldCampaign.is_active;
      
      // Aktif durumunu güncelle
      const result = await client.query(`
        UPDATE campaigns
        SET is_active = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `, [isActive, campaignId]);
      
      const updatedCampaign = result.rows[0];
      
      // Audit log
      await AuditLogService.logAdminAction({
        adminId: admin.id,
        action: isActive ? 'activate_campaign' : 'deactivate_campaign',
        entityType: 'campaign',
        entityId: campaignId,
        oldValue: { is_active: oldIsActive },
        newValue: { is_active: isActive },
        reason: reason,
        metadata: {
          admin_name: admin.name,
          admin_role: admin.role,
        },
      });
      
      await client.query('COMMIT');
      
      return updatedCampaign;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Campaign'i siler (soft delete - Admin-only)
   * 
   * @param {string} campaignId - Campaign ID
   * @param {Object} admin - Admin bilgisi
   * @param {string} reason - Silme nedeni (zorunlu)
   * @returns {Promise<Object>} Silinen campaign
   */
  static async deleteCampaign(campaignId, admin, reason) {
    if (!reason || reason.trim().length === 0) {
      throw new Error('Reason is required for campaign deletion');
    }
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Mevcut campaign'i getir
      const currentCampaign = await client.query(
        'SELECT * FROM campaigns WHERE id = $1',
        [campaignId]
      );
      
      if (currentCampaign.rows.length === 0) {
        throw new Error('Campaign not found');
      }
      
      const oldCampaign = currentCampaign.rows[0];
      
      // Soft delete: is_active = false, status = 'cancelled'
      const result = await client.query(`
        UPDATE campaigns
        SET is_active = false, status = 'cancelled', updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `, [campaignId]);
      
      const deletedCampaign = result.rows[0];
      
      // Audit log
      await AuditLogService.logAdminAction({
        adminId: admin.id,
        action: 'delete_campaign',
        entityType: 'campaign',
        entityId: campaignId,
        oldValue: {
          is_active: oldCampaign.is_active,
          status: oldCampaign.status,
        },
        newValue: {
          is_active: false,
          status: 'cancelled',
        },
        reason: reason,
        metadata: {
          admin_name: admin.name,
          admin_role: admin.role,
        },
      });
      
      await client.query('COMMIT');
      
      return deletedCampaign;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Campaign detaylarını getirir (Admin-only, tüm feed'lerden)
   * 
   * @param {string} campaignId - Campaign ID
   * @returns {Promise<Object>} Campaign detayı
   */
  static async getCampaignDetails(campaignId) {
    const result = await pool.query(
      `SELECT 
        c.*,
        s.name as source_name,
        s.type as source_type,
        s.logo_url as source_logo_url
      FROM campaigns c
      INNER JOIN sources s ON c.source_id = s.id
      WHERE c.id = $1`,
      [campaignId]
    );
    
    if (result.rows.length === 0) {
      throw new Error('Campaign not found');
    }
    
    return result.rows[0];
  }
  
  /**
   * Tüm kampanyaları getirir (Admin-only, feed filtresi olmadan)
   * 
   * @param {Object} filters - Filtreleme parametreleri
   * @returns {Promise<Array>} Campaign listesi
   */
  static async getAllCampaigns(filters = {}) {
    const {
      campaignType = null,
      isActive = null,
      sourceId = null,
      limit = 100,
      offset = 0,
    } = filters;
    
    let query = `
      SELECT 
        c.*,
        s.name as source_name,
        s.type as source_type,
        s.logo_url as source_logo_url
      FROM campaigns c
      INNER JOIN sources s ON c.source_id = s.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;
    
    if (campaignType) {
      query += ` AND c.campaign_type = $${paramIndex}`;
      params.push(campaignType);
      paramIndex++;
    }
    
    if (isActive !== null) {
      query += ` AND c.is_active = $${paramIndex}`;
      params.push(isActive);
      paramIndex++;
    }
    
    if (sourceId) {
      query += ` AND c.source_id = $${paramIndex}`;
      params.push(sourceId);
      paramIndex++;
    }
    
    query += ` ORDER BY c.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    return result.rows;
  }
}

module.exports = AdminCampaignService;
