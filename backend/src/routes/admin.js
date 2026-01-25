/**
 * Admin Routes
 * FAZ 10: Admin & Control Layer
 * 
 * Admin-only endpoints
 * Bot logic'ten tamamen izole
 * Explicit ve auditable actions
 */

const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/adminAuth');
const AdminCampaignService = require('../services/adminCampaignService');
const AuditLogService = require('../services/auditLogService');

// Tüm admin route'ları authentication gerektirir
router.use(requireAdmin);

/**
 * GET /admin/campaigns
 * Tüm kampanyaları getirir (Admin-only, feed filtresi olmadan)
 * 
 * Query params:
 * - campaignType: main, light, category, low
 * - isActive: true, false
 * - sourceId: UUID
 * - limit: number (default: 100)
 * - offset: number (default: 0)
 */
router.get('/campaigns', async (req, res) => {
  try {
    const filters = {
      campaignType: req.query.campaignType || null,
      isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : null,
      sourceId: req.query.sourceId || null,
      limit: parseInt(req.query.limit) || 100,
      offset: parseInt(req.query.offset) || 0,
    };
    
    const campaigns = await AdminCampaignService.getAllCampaigns(filters);
    
    res.json({
      success: true,
      data: campaigns,
      count: campaigns.length,
    });
  } catch (error) {
    console.error('Admin get campaigns error:', error);
    res.status(500).json({
      success: false,
      error: 'Kampanyalar yüklenirken bir hata oluştu',
      message: error.message,
    });
  }
});

/**
 * GET /admin/campaigns/:id
 * Campaign detaylarını getirir (Admin-only)
 */
router.get('/campaigns/:id', async (req, res) => {
  try {
    const campaign = await AdminCampaignService.getCampaignDetails(req.params.id);
    
    res.json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    console.error('Admin get campaign error:', error);
    res.status(404).json({
      success: false,
      error: 'Kampanya bulunamadı',
      message: error.message,
    });
  }
});

/**
 * PATCH /admin/campaigns/:id/type
 * Campaign type'ı değiştirir (Admin-only, explicit)
 * 
 * Body:
 * - campaignType: main, light, category, low
 * - reason: string (zorunlu)
 */
router.patch('/campaigns/:id/type', async (req, res) => {
  try {
    const { campaignType, reason } = req.body;
    
    if (!campaignType) {
      return res.status(400).json({
        success: false,
        error: 'campaignType is required',
      });
    }
    
    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'reason is required for campaign type change',
      });
    }
    
    const updatedCampaign = await AdminCampaignService.changeCampaignType(
      req.params.id,
      campaignType,
      req.admin,
      reason
    );
    
    res.json({
      success: true,
      data: updatedCampaign,
      message: `Campaign type changed to ${campaignType}`,
    });
  } catch (error) {
    console.error('Admin change campaign type error:', error);
    res.status(400).json({
      success: false,
      error: 'Campaign type değiştirilemedi',
      message: error.message,
    });
  }
});

/**
 * PATCH /admin/campaigns/:id/pin
 * Campaign'i pin'ler/unpin'ler (Admin-only)
 * 
 * Body:
 * - isPinned: boolean
 * - reason: string (opsiyonel)
 */
router.patch('/campaigns/:id/pin', async (req, res) => {
  try {
    const { isPinned, reason } = req.body;
    
    if (typeof isPinned !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'isPinned must be a boolean',
      });
    }
    
    const updatedCampaign = await AdminCampaignService.togglePin(
      req.params.id,
      isPinned,
      req.admin,
      reason
    );
    
    res.json({
      success: true,
      data: updatedCampaign,
      message: isPinned ? 'Campaign pinned' : 'Campaign unpinned',
    });
  } catch (error) {
    console.error('Admin toggle pin error:', error);
    res.status(400).json({
      success: false,
      error: 'Campaign pin durumu değiştirilemedi',
      message: error.message,
    });
  }
});

/**
 * PATCH /admin/campaigns/:id/active
 * Campaign'i aktif/pasif yapar (Admin-only)
 * 
 * Body:
 * - isActive: boolean
 * - reason: string (zorunlu)
 */
router.patch('/campaigns/:id/active', async (req, res) => {
  try {
    const { isActive, reason } = req.body;
    
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'isActive must be a boolean',
      });
    }
    
    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'reason is required for active status change',
      });
    }
    
    const updatedCampaign = await AdminCampaignService.toggleActive(
      req.params.id,
      isActive,
      req.admin,
      reason
    );
    
    res.json({
      success: true,
      data: updatedCampaign,
      message: isActive ? 'Campaign activated' : 'Campaign deactivated',
    });
  } catch (error) {
    console.error('Admin toggle active error:', error);
    res.status(400).json({
      success: false,
      error: 'Campaign aktif durumu değiştirilemedi',
      message: error.message,
    });
  }
});

/**
 * DELETE /admin/campaigns/:id
 * Campaign'i siler (soft delete - Admin-only)
 * 
 * Body:
 * - reason: string (zorunlu)
 */
router.delete('/campaigns/:id', async (req, res) => {
  try {
    const { reason } = req.body;
    
    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'reason is required for campaign deletion',
      });
    }
    
    const deletedCampaign = await AdminCampaignService.deleteCampaign(
      req.params.id,
      req.admin,
      reason
    );
    
    res.json({
      success: true,
      data: deletedCampaign,
      message: 'Campaign deleted',
    });
  } catch (error) {
    console.error('Admin delete campaign error:', error);
    res.status(400).json({
      success: false,
      error: 'Campaign silinemedi',
      message: error.message,
    });
  }
});

/**
 * GET /admin/audit-logs
 * Audit log'ları getirir (Admin-only)
 * 
 * Query params:
 * - adminId: string
 * - action: string
 * - entityType: string
 * - entityId: UUID
 * - limit: number (default: 100)
 * - offset: number (default: 0)
 */
router.get('/audit-logs', async (req, res) => {
  try {
    const filters = {
      adminId: req.query.adminId || null,
      action: req.query.action || null,
      entityType: req.query.entityType || null,
      entityId: req.query.entityId || null,
      limit: parseInt(req.query.limit) || 100,
      offset: parseInt(req.query.offset) || 0,
    };
    
    const logs = await AuditLogService.getAuditLogs(filters);
    
    res.json({
      success: true,
      data: logs,
      count: logs.length,
    });
  } catch (error) {
    console.error('Admin get audit logs error:', error);
    res.status(500).json({
      success: false,
      error: 'Audit log\'lar yüklenirken bir hata oluştu',
      message: error.message,
    });
  }
});

module.exports = router;
