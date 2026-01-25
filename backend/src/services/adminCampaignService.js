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
const { assertAdminActionSafe } = require('../utils/safetyGuards');

class AdminCampaignService {
  /**
   * Campaign type'ı değiştirir (Admin-only, explicit)
   * 
   * STRICT TRANSITION RULES:
   * 
   * ALLOWED transitions:
   * - main → hidden
   * - light → hidden
   * - category → hidden
   * - low → hidden
   * 
   * DISALLOWED transitions:
   * - light → main (illegal upgrade)
   * - category → main (illegal upgrade)
   * - low → main (illegal upgrade)
   * - any → main (no auto-upgrade)
   * - hidden → anything (irreversible without super_admin)
   * 
   * SAFETY:
   * - Previous value preserved in audit log
   * - Irreversible action (requires super_admin to reverse)
   * - All transitions logged
   * 
   * @param {string} campaignId - Campaign ID
   * @param {string} newCampaignType - Yeni campaign type (hidden only)
   * @param {Object} admin - Admin bilgisi
   * @param {string} reason - Değişiklik nedeni (zorunlu)
   * @returns {Promise<Object>} Güncellenmiş campaign
   */
  static async changeCampaignType(campaignId, newCampaignType, admin, reason) {
    if (!reason || reason.trim().length === 0) {
      throw new Error('Reason is required for campaign type change');
    }
    
    const validTypes = ['main', 'light', 'category', 'low', 'hidden'];
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
      const oldCampaignType = oldCampaign.campaign_type || 'main';
      
      // Aynı type'a değiştirme kontrolü
      if (oldCampaignType === newCampaignType) {
        await client.query('ROLLBACK');
        throw new Error(`Campaign is already ${newCampaignType}`);
      }
      
      // STRICT TRANSITION VALIDATION
      const allowedTransitions = {
        'main': ['hidden'],
        'light': ['hidden'],
        'category': ['hidden'],
        'low': ['hidden'],
        'hidden': [], // Hidden'dan geri dönüş yok (super_admin gerekli, ayrı fonksiyon)
      };
      
      // İllegal transition kontrolü
      const allowedTargets = allowedTransitions[oldCampaignType] || [];
      if (!allowedTargets.includes(newCampaignType)) {
        await client.query('ROLLBACK');
        
        // Hidden'dan geri dönüş özel mesajı
        if (oldCampaignType === 'hidden') {
          throw new Error('Cannot change from hidden: This is an irreversible action. Only super_admin can reverse hidden status.');
        }
        
        // Illegal upgrade kontrolü
        if (newCampaignType === 'main') {
          throw new Error(`Illegal transition: ${oldCampaignType} → main is not allowed. Auto-upgrade to main feed is forbidden.`);
        }
        
        // Genel illegal transition
        throw new Error(`Illegal transition: ${oldCampaignType} → ${newCampaignType} is not allowed. Allowed transitions: ${allowedTargets.join(', ')}`);
      }
      
      // Hidden'dan geri dönüş için super_admin kontrolü (gelecekte ayrı fonksiyon olabilir)
      if (oldCampaignType === 'hidden' && newCampaignType !== 'hidden') {
        if (admin.role !== 'super_admin') {
          await client.query('ROLLBACK');
          throw new Error('Cannot reverse hidden status: This requires super_admin role');
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
      if (newCampaignType === 'hidden') {
        // Hidden: Feed flags'leri false yap (hiçbir feed'de görünmez)
        updateFields.push(`show_in_light_feed = $${paramIndex}`);
        updateValues.push(false);
        paramIndex++;
        updateFields.push(`show_in_category_feed = $${paramIndex}`);
        updateValues.push(false);
        paramIndex++;
        // Hidden campaigns ayrıca is_hidden = true olmalı
        updateFields.push(`is_hidden = $${paramIndex}`);
        updateValues.push(true);
        paramIndex++;
      } else if (newCampaignType === 'light') {
        updateFields.push(`show_in_light_feed = $${paramIndex}`);
        updateValues.push(true);
        paramIndex++;
        updateFields.push(`show_in_category_feed = $${paramIndex}`);
        updateValues.push(false);
        paramIndex++;
        // Hidden'dan geri dönüş: is_hidden = false
        if (oldCampaignType === 'hidden') {
          updateFields.push(`is_hidden = $${paramIndex}`);
          updateValues.push(false);
          paramIndex++;
        }
      } else if (newCampaignType === 'category') {
        updateFields.push(`show_in_light_feed = $${paramIndex}`);
        updateValues.push(false);
        paramIndex++;
        updateFields.push(`show_in_category_feed = $${paramIndex}`);
        updateValues.push(true);
        paramIndex++;
        // Hidden'dan geri dönüş: is_hidden = false
        if (oldCampaignType === 'hidden') {
          updateFields.push(`is_hidden = $${paramIndex}`);
          updateValues.push(false);
          paramIndex++;
        }
      } else if (newCampaignType === 'main') {
        updateFields.push(`show_in_light_feed = $${paramIndex}`);
        updateValues.push(false);
        paramIndex++;
        updateFields.push(`show_in_category_feed = $${paramIndex}`);
        updateValues.push(false);
        paramIndex++;
        // Hidden'dan geri dönüş: is_hidden = false
        if (oldCampaignType === 'hidden') {
          updateFields.push(`is_hidden = $${paramIndex}`);
          updateValues.push(false);
          paramIndex++;
        }
      } else if (newCampaignType === 'low') {
        // Low value: Feed flags değişmez, sadece value_level güncellenir
        updateFields.push(`value_level = $${paramIndex}`);
        updateValues.push('low');
        paramIndex++;
        // Hidden'dan geri dönüş: is_hidden = false
        if (oldCampaignType === 'hidden') {
          updateFields.push(`is_hidden = $${paramIndex}`);
          updateValues.push(false);
          paramIndex++;
        }
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
      
      // Audit log - Previous value preserved
      await AuditLogService.logAdminAction({
        adminId: admin.id,
        action: 'update_campaign_type',
        entityType: 'campaign',
        entityId: campaignId,
        oldValue: {
          campaign_type: oldCampaignType,
          show_in_light_feed: oldCampaign.show_in_light_feed,
          show_in_category_feed: oldCampaign.show_in_category_feed,
          is_hidden: oldCampaign.is_hidden,
          value_level: oldCampaign.value_level,
          // Previous value fully preserved for audit trail
        },
        newValue: {
          campaign_type: newCampaignType,
          show_in_light_feed: updatedCampaign.show_in_light_feed,
          show_in_category_feed: updatedCampaign.show_in_category_feed,
          is_hidden: updatedCampaign.is_hidden,
          value_level: updatedCampaign.value_level,
        },
        reason: reason,
        metadata: {
          admin_name: admin.name,
          admin_role: admin.role,
          transition: `${oldCampaignType} → ${newCampaignType}`,
          is_irreversible: newCampaignType === 'hidden',
          requires_super_admin_to_reverse: newCampaignType === 'hidden',
        },
      });
      
      await client.query('COMMIT');
      
      // Runtime safety check (FAZ 10: Final Safety Validation)
      assertAdminActionSafe(updatedCampaign, 'changeCampaignType', `Campaign ${campaignId}`);
      
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
   * SAFETY RULES:
   * - campaign_type değiştirilmez
   * - FAZ 6 filtreleri bypass edilmez
   * - Pinning sadece aynı feed içinde sıralamayı etkiler
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
      
      // SAFETY CHECK: campaign_type değiştirilmemeli
      // Bu fonksiyon sadece is_pinned ve pinned_at'ı değiştirir
      // campaign_type değişikliği için changeCampaignType() kullanılmalı
      
      // Pin durumunu güncelle (pinned_at timestamp ile)
      const pinnedAt = isPinned ? new Date() : null;
      const result = await client.query(`
        UPDATE campaigns
        SET is_pinned = $1, pinned_at = $2, updated_at = NOW()
        WHERE id = $3
        RETURNING *
      `, [isPinned, pinnedAt, campaignId]);
      
      const updatedCampaign = result.rows[0];
      
      // Audit log
      await AuditLogService.logAdminAction({
        adminId: admin.id,
        action: isPinned ? 'pin_campaign' : 'unpin_campaign',
        entityType: 'campaign',
        entityId: campaignId,
        oldValue: { 
          is_pinned: oldIsPinned, 
          pinned_at: oldCampaign.pinned_at,
          campaign_type: oldCampaign.campaign_type, // Safety: campaign_type değişmedi
        },
        newValue: { 
          is_pinned: isPinned, 
          pinned_at: pinnedAt,
          campaign_type: updatedCampaign.campaign_type, // Safety: campaign_type değişmedi
        },
        reason: reason || (isPinned ? 'Campaign pinned by admin' : 'Campaign unpinned by admin'),
        metadata: {
          admin_name: admin.name,
          admin_role: admin.role,
          safety_note: 'campaign_type unchanged - pinning only affects ordering within same feed',
        },
      });
      
      await client.query('COMMIT');
      
      // Runtime safety check (FAZ 10: Final Safety Validation)
      assertAdminActionSafe(updatedCampaign, 'togglePin', `Campaign ${campaignId}`);
      
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
      
      // Runtime safety check (FAZ 10: Final Safety Validation)
      assertAdminActionSafe(updatedCampaign, 'toggleActive', `Campaign ${campaignId}`);
      
      return updatedCampaign;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Campaign'i gizler/gösterir (Admin-only)
   * 
   * SAFETY RULES:
   * - campaign_type değiştirilmez
   * - FAZ 6 filtreleri bypass edilmez
   * - Hidden campaigns hiçbir feed'de görünmez
   * 
   * @param {string} campaignId - Campaign ID
   * @param {boolean} isHidden - Gizleme durumu
   * @param {Object} admin - Admin bilgisi
   * @param {string} reason - Gizleme/gösterme nedeni (zorunlu)
   * @returns {Promise<Object>} Güncellenmiş campaign
   */
  static async toggleHidden(campaignId, isHidden, admin, reason) {
    if (!reason || reason.trim().length === 0) {
      throw new Error('Reason is required for hide/unhide operation');
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
      const oldIsHidden = oldCampaign.is_hidden || false;
      
      // SAFETY CHECK: campaign_type değiştirilmemeli
      // Bu fonksiyon sadece is_hidden'ı değiştirir
      // campaign_type değişikliği için changeCampaignType() kullanılmalı
      
      // Hidden durumunu güncelle
      const result = await client.query(`
        UPDATE campaigns
        SET is_hidden = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `, [isHidden, campaignId]);
      
      const updatedCampaign = result.rows[0];
      
      // Audit log
      await AuditLogService.logAdminAction({
        adminId: admin.id,
        action: isHidden ? 'hide_campaign' : 'unhide_campaign',
        entityType: 'campaign',
        entityId: campaignId,
        oldValue: { 
          is_hidden: oldIsHidden,
          campaign_type: oldCampaign.campaign_type, // Safety: campaign_type değişmedi
        },
        newValue: { 
          is_hidden: isHidden,
          campaign_type: updatedCampaign.campaign_type, // Safety: campaign_type değişmedi
        },
        reason: reason,
        metadata: {
          admin_name: admin.name,
          admin_role: admin.role,
          safety_note: 'campaign_type unchanged - hide/unhide only affects visibility',
        },
      });
      
      await client.query('COMMIT');
      
      // Runtime safety check (FAZ 10: Final Safety Validation)
      assertAdminActionSafe(updatedCampaign, 'toggleHidden', `Campaign ${campaignId}`);
      
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
