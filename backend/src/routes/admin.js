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
const { 
  requireAdmin, 
  requireSuperAdminOrEditor, 
  requireViewerOrAbove 
} = require('../middleware/adminAuth');
const AdminCampaignService = require('../services/adminCampaignService');
const AuditLogService = require('../services/auditLogService');
const CampaignExplainService = require('../services/campaignExplainService');
const AdminDashboardService = require('../services/adminDashboardService');
const AdminSourceService = require('../services/adminSourceService');
const Source = require('../models/Source');

// Tüm admin route'ları authentication gerektirir
router.use(requireAdmin);

/**
 * GET /admin/campaigns
 * Tüm kampanyaları getirir (Admin-only, feed filtresi ile)
 * Access: viewer, editor, super_admin (all roles)
 * 
 * Query params:
 * - filter: feed_type (main, light, category, low, hidden)
 * - isActive: true, false
 * - sourceId: UUID
 * - limit: number (default: 50, max: 200)
 * - offset: number (default: 0)
 * 
 * Optimized queries with safe pagination
 */
router.get('/campaigns', requireViewerOrAbove(), async (req, res) => {
  try {
    const filters = {
      feed_type: req.query.filter || req.query.feed_type || null,
      isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : null,
      sourceId: req.query.sourceId || null,
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0,
    };
    
    const result = await AdminDashboardService.getCampaignsWithFeedFilter(filters);
    
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
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
 * Access: viewer, editor, super_admin (all roles)
 */
router.get('/campaigns/:id', requireViewerOrAbove(), async (req, res) => {
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
 * GET /admin/campaigns/:id/explain
 * Campaign'in main feed durumunu açıklar (Admin-only, read-only)
 * Access: viewer, editor, super_admin (all roles)
 * 
 * Explains:
 * - Why campaign is NOT in main feed
 * - Which rule blocked it
 * - campaign_type, value_level, filter results
 * - hidden / pinned state
 * - Feed assignments
 * 
 * Rules:
 * - Read-only (no mutations)
 * - Pure diagnostics
 */
router.get('/campaigns/:id/explain', requireViewerOrAbove(), async (req, res) => {
  try {
    const explanation = await CampaignExplainService.explainCampaign(req.params.id);
    
    res.json({
      success: true,
      data: explanation,
    });
  } catch (error) {
    console.error('Admin explain campaign error:', error);
    res.status(404).json({
      success: false,
      error: 'Kampanya açıklaması alınamadı',
      message: error.message,
    });
  }
});

/**
 * PATCH /admin/campaigns/:id/type
 * Campaign type'ı değiştirir (Admin-only, explicit)
 * Access: editor, super_admin (modify operations)
 * 
 * STRICT TRANSITION RULES:
 * - ALLOWED: main/light/category/low → hidden
 * - DISALLOWED: light/category/low → main (illegal upgrade)
 * - DISALLOWED: hidden → anything (irreversible without super_admin)
 * 
 * Body:
 * - campaignType: hidden (only allowed transition)
 * - reason: string (zorunlu)
 */
router.patch('/campaigns/:id/type', requireSuperAdminOrEditor(), async (req, res) => {
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
 * Access: editor, super_admin (modify operations)
 * 
 * Body:
 * - isPinned: boolean
 * - reason: string (opsiyonel)
 */
router.patch('/campaigns/:id/pin', requireSuperAdminOrEditor(), async (req, res) => {
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
 * PATCH /admin/campaigns/:id/hide
 * Campaign'i gizler/gösterir (Admin-only)
 * Access: editor, super_admin (modify operations)
 * 
 * SAFETY: campaign_type değiştirilmez, FAZ 6 filtreleri bypass edilmez
 * Hidden campaigns hiçbir feed'de görünmez
 * 
 * Body:
 * - isHidden: boolean
 * - reason: string (zorunlu)
 */
router.patch('/campaigns/:id/hide', requireSuperAdminOrEditor(), async (req, res) => {
  try {
    const { isHidden, reason } = req.body;
    
    if (typeof isHidden !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'isHidden must be a boolean',
      });
    }
    
    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'reason is required for hide/unhide operation',
      });
    }
    
    const updatedCampaign = await AdminCampaignService.toggleHidden(
      req.params.id,
      isHidden,
      req.admin,
      reason
    );
    
    res.json({
      success: true,
      data: updatedCampaign,
      message: isHidden ? 'Campaign hidden' : 'Campaign unhidden',
    });
  } catch (error) {
    console.error('Admin toggle hidden error:', error);
    res.status(400).json({
      success: false,
      error: 'Campaign gizleme durumu değiştirilemedi',
      message: error.message,
    });
  }
});

/**
 * PATCH /admin/campaigns/:id/active
 * Campaign'i aktif/pasif yapar (Admin-only)
 * Access: editor, super_admin (modify operations)
 * 
 * Body:
 * - isActive: boolean
 * - reason: string (zorunlu)
 */
router.patch('/campaigns/:id/active', requireSuperAdminOrEditor(), async (req, res) => {
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
 * Access: editor, super_admin (modify operations)
 * 
 * Body:
 * - reason: string (zorunlu)
 */
router.delete('/campaigns/:id', requireSuperAdminOrEditor(), async (req, res) => {
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
 * GET /admin/overview
 * Dashboard overview metrics (Admin-only, read-only)
 * Access: viewer, editor, super_admin (all roles)
 * 
 * Returns:
 * - Total campaign counts
 * - Feed counts (main, light, category, low)
 * - Special states (hidden, pinned, expiring soon, expired)
 * 
 * Rules:
 * - No mutations
 * - Optimized queries
 */
router.get('/overview', requireViewerOrAbove(), async (req, res) => {
  try {
    const overview = await AdminDashboardService.getOverview();
    
    res.json({
      success: true,
      data: overview,
    });
  } catch (error) {
    console.error('Admin get overview error:', error);
    res.status(500).json({
      success: false,
      error: 'Dashboard overview yüklenirken bir hata oluştu',
      message: error.message,
    });
  }
});

/**
 * GET /admin/stats
 * Detailed campaign statistics (Admin-only, read-only)
 * Access: viewer, editor, super_admin (all roles)
 * 
 * Returns:
 * - Feed distribution
 * - Hidden campaigns breakdown
 * - Pinned campaigns breakdown
 * - Expiring soon breakdown
 * - Top sources
 * 
 * Rules:
 * - No mutations
 * - Optimized queries
 */
router.get('/stats', requireViewerOrAbove(), async (req, res) => {
  try {
    const stats = await AdminDashboardService.getStats();
    
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Admin get stats error:', error);
    res.status(500).json({
      success: false,
      error: 'İstatistikler yüklenirken bir hata oluştu',
      message: error.message,
    });
  }
});

/**
 * GET /admin/sources
 * Tüm source'ları getirir (Admin-only, tüm status'ler)
 * Access: viewer, editor, super_admin (all roles)
 * 
 * Query params:
 * - status: active, backlog, hard_backlog
 * - type: bank, operator
 * - isActive: true, false
 */
router.get('/sources', requireViewerOrAbove(), async (req, res) => {
  try {
    const filters = {
      status: req.query.status || null,
      type: req.query.type || null,
      isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : null,
    };
    
    const sources = await AdminSourceService.getAllSources(filters);
    
    res.json({
      success: true,
      data: sources,
      count: sources.length,
    });
  } catch (error) {
    console.error('Admin get sources error:', error);
    res.status(500).json({
      success: false,
      error: 'Kaynaklar yüklenirken bir hata oluştu',
      message: error.message,
    });
  }
});

/**
 * GET /admin/sources/:id
 * Source detaylarını getirir (Admin-only)
 * Access: viewer, editor, super_admin (all roles)
 */
router.get('/sources/:id', requireViewerOrAbove(), async (req, res) => {
  try {
    const source = await AdminSourceService.getSourceDetails(req.params.id);
    
    res.json({
      success: true,
      data: source,
    });
  } catch (error) {
    console.error('Admin get source error:', error);
    res.status(404).json({
      success: false,
      error: 'Kaynak bulunamadı',
      message: error.message,
    });
  }
});

/**
 * PATCH /admin/sources/:id/status
 * Source status'ü günceller (Admin-only)
 * Access: editor, super_admin (modify operations)
 * 
 * Body:
 * - status: active, backlog, hard_backlog
 * - reason: string (zorunlu)
 */
router.patch('/sources/:id/status', requireSuperAdminOrEditor(), async (req, res) => {
  try {
    const { status, reason } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'status is required',
      });
    }
    
    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'reason is required for source status update',
      });
    }
    
    const updatedSource = await AdminSourceService.updateSourceStatus(
      req.params.id,
      status,
      reason,
      req.admin
    );
    
    res.json({
      success: true,
      data: updatedSource,
      message: `Source status changed to ${status}`,
    });
  } catch (error) {
    console.error('Admin update source status error:', error);
    res.status(400).json({
      success: false,
      error: 'Source status değiştirilemedi',
      message: error.message,
    });
  }
});

/**
 * GET /admin/audit-logs
 * Audit log'ları getirir (Admin-only)
 * Access: viewer, editor, super_admin (all roles)
 * 
 * Query params:
 * - adminId: string
 * - action: string
 * - entityType: string
 * - entityId: UUID
 * - limit: number (default: 100)
 * - offset: number (default: 0)
 */
router.get('/audit-logs', requireViewerOrAbove(), async (req, res) => {
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
