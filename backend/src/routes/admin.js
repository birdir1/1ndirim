/**
 * Admin Routes
 * FAZ 10: Admin & Control Layer
 * 
 * Admin-only endpoints
 * Bot logic'ten tamamen izole
 * Explicit ve auditable actions
 */

const crypto = require('crypto');
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
const pool = require('../config/database');
const { getTimeline } = require('../services/governanceTimelineService');
const governanceAssertions = require('../utils/governanceAssertions');

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

/**
 * FAZ 21.1: Governance timeline (read-only).
 * GET /admin/governance/timeline — unified event stream from admin_audit_logs.
 * Pagination: limit (default 50, max 200), offset (default 0).
 */
router.get('/governance/timeline', requireViewerOrAbove(), async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const offset = parseInt(req.query.offset, 10) || 0;
    const { events } = await getTimeline({ limit, offset });
    res.json({ success: true, data: events });
  } catch (error) {
    console.error('Admin governance timeline error:', error);
    res.status(500).json({
      success: false,
      error: 'Governance timeline yüklenirken bir hata oluştu',
      message: error.message,
    });
  }
});

/**
 * FAZ 21.2: Decision comparison (read-only).
 * GET /admin/decisions/compare?scope=&target_id=&limit=10
 * suggestions, executions, diff (suggested vs executed).
 */
router.get('/decisions/compare', requireViewerOrAbove(), async (req, res) => {
  try {
    const scope = req.query.scope || null;
    const target_id = req.query.target_id || null;
    const limit = Math.min(Math.max(1, parseInt(req.query.limit, 10) || 10), 100);
    if (!scope || !target_id) {
      return res.status(400).json({
        success: false,
        error: 'scope ve target_id zorunludur',
      });
    }
    const sugQ = 'SELECT * FROM admin_suggestions WHERE scope = $1 AND target_id = $2 ORDER BY created_at DESC LIMIT $3';
    const sug = await pool.query(sugQ, [scope, target_id, limit]);
    const suggestions = sug.rows.map((r) => ({
      id: r.id,
      scope: r.scope,
      target_id: r.target_id,
      suggestion_type: r.suggestion_type,
      suggested_action: r.suggested_action,
      confidence: r.confidence,
      reason: r.reason,
      applied_at: r.applied_at,
      executed_at: r.executed_at,
      rejected_at: r.rejected_at,
    }));
    const executed = suggestions.filter((s) => s.executed_at);
    const execIds = executed.map((s) => s.id);
    let executions = [];
    if (execIds.length > 0) {
      const placeholders = execIds.map((_, i) => `$${i + 1}`).join(',');
      const auditRes = await pool.query(
        `SELECT entity_id, action, metadata, created_at FROM admin_audit_logs
         WHERE entity_type = 'admin_suggestion_execution' AND action != 'execution_failed'
         AND entity_id IN (${placeholders})
         ORDER BY created_at DESC`,
        execIds
      );
      executions = auditRes.rows.map((row) => {
        const meta = row.metadata && typeof row.metadata === 'object' ? row.metadata : {};
        const snap = meta.suggestion_snapshot || {};
        return {
          suggestion_id: row.entity_id,
          executed_action: row.action,
          executed_at: row.created_at,
          admin_note: meta.admin_note || null,
          suggested_action: snap.suggested_action || null,
          confidence: snap.confidence ?? null,
        };
      });
    }
    const bySid = new Map(executions.map((e) => [String(e.suggestion_id), e]));
    const diff = executed.map((s) => {
      const ex = bySid.get(String(s.id));
      const suggested_action = s.suggested_action;
      const executed_action = ex ? ex.executed_action : null;
      const matched = !!(
        (executed_action === 'change_source_status' && (suggested_action === 'backlog' || suggested_action === 'hard_backlog')) ||
        (executed_action === 'downgrade_campaign' && suggested_action === 'auto_low_value') ||
        (executed_action === 'hide_campaign' && suggested_action === 'hide')
      );
      return {
        suggested_action,
        executed_action,
        matched,
        admin_note: ex ? ex.admin_note : null,
        confidence: s.confidence ?? null,
      };
    });
    res.json({ success: true, data: { suggestions, executions, diff } });
  } catch (error) {
    console.error('Admin decisions compare error:', error);
    res.status(500).json({
      success: false,
      error: 'Karşılaştırma yüklenirken bir hata oluştu',
      message: error.message,
    });
  }
});

/**
 * FAZ 21.4: Governance metrics (read-only, on-demand).
 * GET /admin/governance/metrics
 */
router.get('/governance/metrics', requireViewerOrAbove(), async (req, res) => {
  try {
    const [countAll, countApplied, countExecuted, countRejected, avgConf, actionRows] = await Promise.all([
      pool.query('SELECT COUNT(*)::int AS total FROM admin_suggestions'),
      pool.query('SELECT COUNT(*)::int AS c FROM admin_suggestions WHERE applied_at IS NOT NULL'),
      pool.query('SELECT COUNT(*)::int AS c FROM admin_suggestions WHERE executed_at IS NOT NULL'),
      pool.query('SELECT COUNT(*)::int AS c FROM admin_suggestions WHERE rejected_at IS NOT NULL'),
      pool.query('SELECT COALESCE(AVG(confidence), 0)::float AS avg FROM admin_suggestions WHERE executed_at IS NOT NULL'),
      pool.query(
        `SELECT action, COUNT(*)::int AS cnt FROM admin_audit_logs
         WHERE entity_type = 'admin_suggestion_execution' AND action != 'execution_failed'
         GROUP BY action ORDER BY cnt DESC LIMIT 1`
      ),
    ]);
    const suggestions_created = (countAll.rows[0] && countAll.rows[0].total) ?? 0;
    const applied = (countApplied.rows[0] && countApplied.rows[0].c) ?? 0;
    const executed = (countExecuted.rows[0] && countExecuted.rows[0].c) ?? 0;
    const rejected = (countRejected.rows[0] && countRejected.rows[0].c) ?? 0;
    const avg_confidence_executed = (avgConf.rows[0] && avgConf.rows[0].avg) ?? 0;
    const totalDecided = applied + rejected;
    const execution_rate = applied > 0 ? Math.round((100 * executed) / applied) : 0;
    const override_rate = totalDecided > 0 ? Math.round((100 * rejected) / totalDecided) : 0;
    const most_common_execution_action = (actionRows.rows[0] && actionRows.rows[0].action) || null;
    res.json({
      success: true,
      data: {
        suggestions_created,
        suggestions_applied: applied,
        suggestions_executed: executed,
        suggestions_rejected: rejected,
        execution_rate,
        override_rate,
        avg_confidence_executed: Math.round(avg_confidence_executed * 10) / 10,
        most_common_execution_action,
      },
    });
  } catch (error) {
    console.error('Admin governance metrics error:', error);
    res.status(500).json({
      success: false,
      error: 'Metrikler hesaplanırken bir hata oluştu',
      message: error.message,
    });
  }
});

/**
 * FAZ 18.4 / FAZ 19.2: Admin suggestions (passive storage, admin-only).
 * GET /admin/suggestions — list stored suggestions.
 * Filters: state (new | applied | rejected | expired), scope, target_id.
 * State logic: NEW = pending; APPLIED/REJECTED = decided; EXPIRED = expires_at < now and not decided.
 * FAZ 20.5: EXECUTED = executed_at IS NOT NULL. Response includes executed_at, executed_by.
 */
router.get('/suggestions', requireViewerOrAbove(), async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 200);
    const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);
    const scope = req.query.scope || null;
    const target_id = req.query.target_id || null;
    const state = (req.query.state || '').toLowerCase();

    let query = 'SELECT * FROM admin_suggestions WHERE 1=1';
    const params = [];
    let idx = 1;

    if (scope) {
      query += ` AND scope = $${idx}`;
      params.push(scope);
      idx++;
    }
    if (target_id) {
      query += ` AND target_id = $${idx}`;
      params.push(target_id);
      idx++;
    }
    if (state === 'new') {
      query += ` AND applied_at IS NULL AND rejected_at IS NULL AND expires_at >= NOW()`;
    } else if (state === 'applied') {
      query += ` AND applied_at IS NOT NULL`;
    } else if (state === 'rejected') {
      query += ` AND rejected_at IS NOT NULL`;
    } else if (state === 'expired') {
      query += ` AND applied_at IS NULL AND rejected_at IS NULL AND expires_at < NOW()`;
    } else if (state === 'executed') {
      query += ` AND executed_at IS NOT NULL`;
    }

    query += ` ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    const rows = result.rows.map((r) => ({
      id: r.id,
      scope: r.scope,
      target_id: r.target_id,
      suggestion_type: r.suggestion_type,
      suggested_action: r.suggested_action,
      confidence: r.confidence,
      reason: r.reason,
      signals: r.signals || {},
      run_id: r.run_id,
      created_at: r.created_at,
      expires_at: r.expires_at,
      applied_at: r.applied_at,
      applied_by: r.applied_by,
      rejected_at: r.rejected_at,
      executed_at: r.executed_at ?? null,
      executed_by: r.executed_by ?? null,
    }));

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Admin get suggestions error:', error);
    res.status(500).json({
      success: false,
      error: 'Öneriler yüklenirken bir hata oluştu',
      message: error.message,
    });
  }
});

/**
 * FAZ 19.1: Admin suggestion ingest (controlled entry).
 * POST /admin/suggestions/ingest — admin-only (editor+). Bot MUST NOT call.
 * Payload must match FAZ 18 suggestion schema. Inserts row and writes AuditLog action=ingest.
 * Does NOT apply, modify campaigns, or modify sources.
 */
router.post('/suggestions/ingest', requireSuperAdminOrEditor(), async (req, res) => {
  try {
    const adminId = (req.admin && req.admin.id) ? String(req.admin.id) : null;
    if (!adminId) {
      return res.status(401).json({ success: false, error: 'Admin bilgisi bulunamadı' });
    }
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const scope = body.scope;
    const target_id = body.target_id;
    const suggestion_type = body.suggestion_type;
    const suggested_action = body.suggested_action;
    const confidence = body.confidence;
    const reason = body.reason;
    const signals = body.signals && typeof body.signals === 'object' ? body.signals : {};
    const run_id = body.run_id != null ? String(body.run_id) : null;
    const suggestion_id = body.suggestion_id;
    const created_at = body.created_at || new Date().toISOString();
    const expires_at = body.expires_at || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    if (scope !== 'source' && scope !== 'campaign') {
      return res.status(400).json({
        success: false,
        error: 'Geçersiz payload',
        message: 'scope must be "source" or "campaign"',
      });
    }
    if (!target_id || typeof target_id !== 'string' || !target_id.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Geçersiz payload',
        message: 'target_id is required and must be a non-empty string',
      });
    }
    if (!suggestion_type || typeof suggestion_type !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Geçersiz payload',
        message: 'suggestion_type is required',
      });
    }
    if (!suggested_action || typeof suggested_action !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Geçersiz payload',
        message: 'suggested_action is required',
      });
    }
    const confNum = parseInt(confidence, 10);
    if (isNaN(confNum) || confNum < 0 || confNum > 100) {
      return res.status(400).json({
        success: false,
        error: 'Geçersiz payload',
        message: 'confidence must be 0–100',
      });
    }
    if (!reason || typeof reason !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Geçersiz payload',
        message: 'reason is required',
      });
    }

    const id = suggestion_id && typeof suggestion_id === 'string' && suggestion_id.trim()
      ? suggestion_id.trim()
      : crypto.randomUUID();

    const insertResult = await pool.query(
      `INSERT INTO admin_suggestions (
        id, scope, target_id, suggestion_type, suggested_action, confidence, reason, signals, run_id, created_at, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::timestamptz, $11::timestamptz)
      RETURNING id, scope, target_id, suggestion_type, suggested_action, confidence, reason, signals, run_id, created_at, expires_at`,
      [id, scope, target_id.trim(), suggestion_type, suggested_action, confNum, reason, JSON.stringify(signals), run_id, created_at, expires_at]
    );
    const inserted = insertResult.rows[0];
    const payload = {
      id: inserted.id,
      scope: inserted.scope,
      target_id: inserted.target_id,
      suggestion_type: inserted.suggestion_type,
      suggested_action: inserted.suggested_action,
      confidence: inserted.confidence,
      reason: inserted.reason,
      signals: inserted.signals || {},
      run_id: inserted.run_id,
      created_at: inserted.created_at,
      expires_at: inserted.expires_at,
    };

    await AuditLogService.logAdminAction({
      adminId,
      action: 'ingest',
      entityType: 'admin_suggestion',
      entityId: String(inserted.id),
      metadata: payload,
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({ success: true, data: payload });
  } catch (error) {
    console.error('Admin suggestions ingest error:', error);
    res.status(500).json({
      success: false,
      error: 'Öneri kaydedilirken bir hata oluştu',
      message: error.message,
    });
  }
});

/**
 * FAZ 19.3: Admin decision context (read-only).
 * GET /admin/suggestions/:id/context — suggestion payload, signals, run_id, related snapshot.
 * For source scope: current source row (id, name, source_status). For campaign: current campaign row.
 * NO live recomputation.
 */
router.get('/suggestions/:id/context', requireViewerOrAbove(), async (req, res) => {
  try {
    const id = req.params.id;
    const sel = await pool.query('SELECT * FROM admin_suggestions WHERE id = $1', [id]);
    if (sel.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Öneri bulunamadı',
      });
    }
    const row = sel.rows[0];
    const suggestion = {
      id: row.id,
      scope: row.scope,
      target_id: row.target_id,
      suggestion_type: row.suggestion_type,
      suggested_action: row.suggested_action,
      confidence: row.confidence,
      reason: row.reason,
      signals: row.signals || {},
      run_id: row.run_id,
      created_at: row.created_at,
      expires_at: row.expires_at,
    };
    const result = { suggestion, signals: row.signals || {}, run_id: row.run_id };

    if (row.scope === 'source' && row.target_id) {
      const src = await pool.query(
        'SELECT id, name, source_status, status_reason, is_active FROM sources WHERE name = $1 OR id::text = $1 LIMIT 1',
        [String(row.target_id).trim(), String(row.target_id).trim()]
      );
      result.snapshot = { source: src.rows[0] || null };
      if (row.signals && typeof row.signals === 'object' && row.signals.source_trust_score != null) {
        result.snapshot.source_trust_score = row.signals.source_trust_score;
      }
      if (row.signals && typeof row.signals === 'object') {
        result.snapshot.recent_failures = {
          dom_changed: row.signals.dom_changed ?? null,
          network_blocked: row.signals.network_blocked ?? null,
        };
      }
    } else if (row.scope === 'campaign' && row.target_id) {
      const camp = await pool.query(
        `SELECT c.id, c.campaign_type, c.value_level, c.is_hidden, c.is_active, c.source_id, s.name as source_name
         FROM campaigns c LEFT JOIN sources s ON s.id = c.source_id WHERE c.id::text = $1 LIMIT 1`,
        [String(row.target_id).trim()]
      );
      result.snapshot = { campaign: camp.rows[0] || null };
      if (row.signals && typeof row.signals === 'object') {
        result.snapshot.confidence_feedback = row.signals.confidence_score != null
          ? { confidence_score: row.signals.confidence_score, source: row.signals.source }
          : null;
      }
    } else {
      result.snapshot = {};
    }

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Admin suggestion context error:', error);
    res.status(500).json({
      success: false,
      error: 'Öneri bağlamı alınırken bir hata oluştu',
      message: error.message,
    });
  }
});

/**
 * FAZ 18.4–18.5 / FAZ 19.4: Apply suggestion (admin-only).
 * Requires body: { confirmed: true, admin_note: "min 10 chars" }. Logs admin_note in AuditLog.
 * Only updates applied_at, applied_by. No auto side effects.
 */
router.post('/suggestions/:id/apply', requireSuperAdminOrEditor(), async (req, res) => {
  try {
    const id = req.params.id;
    const adminId = (req.admin && req.admin.id) ? String(req.admin.id) : null;
    if (!adminId) {
      return res.status(401).json({ success: false, error: 'Admin bilgisi bulunamadı' });
    }
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    if (body.confirmed !== true) {
      return res.status(400).json({
        success: false,
        error: 'Onay gerekli',
        message: 'confirmed must be true',
      });
    }
    const admin_note = typeof body.admin_note === 'string' ? body.admin_note.trim() : '';
    if (admin_note.length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Açıklama gerekli',
        message: 'admin_note is required and must be at least 10 characters',
      });
    }

    const sel = await pool.query(
      'SELECT * FROM admin_suggestions WHERE id = $1 AND applied_at IS NULL AND rejected_at IS NULL',
      [id]
    );
    if (sel.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Öneri bulunamadı veya zaten uygulandı/reddedildi',
      });
    }
    const row = sel.rows[0];
    const payload = {
      id: row.id,
      scope: row.scope,
      target_id: row.target_id,
      suggestion_type: row.suggestion_type,
      suggested_action: row.suggested_action,
      confidence: row.confidence,
      reason: row.reason,
      signals: row.signals || {},
      run_id: row.run_id,
      created_at: row.created_at,
      expires_at: row.expires_at,
      admin_note,
    };

    await pool.query(
      'UPDATE admin_suggestions SET applied_at = NOW(), applied_by = $1 WHERE id = $2',
      [adminId, id]
    );

    await AuditLogService.logAdminAction({
      adminId,
      action: 'apply',
      entityType: 'admin_suggestion',
      entityId: id,
      metadata: payload,
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('user-agent'),
    });

    res.json({ success: true, data: { id, applied_at: new Date().toISOString(), applied_by: adminId } });
  } catch (error) {
    console.error('Admin apply suggestion error:', error);
    res.status(500).json({
      success: false,
      error: 'Öneri uygulanırken bir hata oluştu',
      message: error.message,
    });
  }
});

/**
 * FAZ 18.4–18.5 / FAZ 19.4: Reject suggestion (admin-only).
 * Requires body: { confirmed: true, admin_note: "min 10 chars" }. Logs admin_note in AuditLog.
 * Only updates rejected_at. No auto side effects.
 */
router.post('/suggestions/:id/reject', requireSuperAdminOrEditor(), async (req, res) => {
  try {
    const id = req.params.id;
    const adminId = (req.admin && req.admin.id) ? String(req.admin.id) : null;
    if (!adminId) {
      return res.status(401).json({ success: false, error: 'Admin bilgisi bulunamadı' });
    }
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    if (body.confirmed !== true) {
      return res.status(400).json({
        success: false,
        error: 'Onay gerekli',
        message: 'confirmed must be true',
      });
    }
    const admin_note = typeof body.admin_note === 'string' ? body.admin_note.trim() : '';
    if (admin_note.length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Açıklama gerekli',
        message: 'admin_note is required and must be at least 10 characters',
      });
    }

    const sel = await pool.query(
      'SELECT * FROM admin_suggestions WHERE id = $1 AND applied_at IS NULL AND rejected_at IS NULL',
      [id]
    );
    if (sel.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Öneri bulunamadı veya zaten uygulandı/reddedildi',
      });
    }
    const row = sel.rows[0];
    const payload = {
      id: row.id,
      scope: row.scope,
      target_id: row.target_id,
      suggestion_type: row.suggestion_type,
      suggested_action: row.suggested_action,
      confidence: row.confidence,
      reason: row.reason,
      signals: row.signals || {},
      run_id: row.run_id,
      created_at: row.created_at,
      expires_at: row.expires_at,
      admin_note,
    };

    await pool.query('UPDATE admin_suggestions SET rejected_at = NOW() WHERE id = $1', [id]);

    await AuditLogService.logAdminAction({
      adminId,
      action: 'reject',
      entityType: 'admin_suggestion',
      entityId: id,
      metadata: payload,
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('user-agent'),
    });

    res.json({ success: true, data: { id, rejected_at: new Date().toISOString() } });
  } catch (error) {
    console.error('Admin reject suggestion error:', error);
    res.status(500).json({
      success: false,
      error: 'Öneri reddedilirken bir hata oluştu',
      message: error.message,
    });
  }
});

/**
 * FAZ 20.1–20.4: Execute suggestion (admin-only, explicit, non-automatic).
 * POST /admin/suggestions/:id/execute
 * Preconditions: applied_at IS NOT NULL, rejected_at IS NULL, expires_at > NOW(), executed_at IS NULL.
 * Body: { confirmed: true, execution_action: "change_source_status"|"downgrade_campaign"|"hide_campaign", admin_note: "min 10 chars" }.
 * execution_action must match suggestion; mismatch → 409. Calls existing admin services only. Audit on success/failure.
 */
router.post('/suggestions/:id/execute', requireSuperAdminOrEditor(), async (req, res) => {
  const id = req.params.id;
  const adminId = (req.admin && req.admin.id) ? String(req.admin.id) : null;
  if (!adminId) {
    return res.status(401).json({ success: false, error: 'Admin bilgisi bulunamadı' });
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  if (body.confirmed !== true) {
    return res.status(400).json({
      success: false,
      error: 'Onay gerekli',
      message: 'confirmed must be true',
    });
  }
  const admin_note = typeof body.admin_note === 'string' ? body.admin_note.trim() : '';
  if (admin_note.length < 10) {
    return res.status(400).json({
      success: false,
      error: 'Açıklama gerekli',
      message: 'admin_note is required and must be at least 10 characters',
    });
  }
  const execution_action = typeof body.execution_action === 'string' ? body.execution_action.trim() : '';
  const allowedActions = ['change_source_status', 'downgrade_campaign', 'hide_campaign'];
  if (!allowedActions.includes(execution_action)) {
    return res.status(400).json({
      success: false,
      error: 'Geçersiz execution_action',
      message: 'execution_action must be one of: change_source_status, downgrade_campaign, hide_campaign',
    });
  }

  let row;
  try {
    const sel = await pool.query(
      `SELECT * FROM admin_suggestions
       WHERE id = $1 AND applied_at IS NOT NULL AND rejected_at IS NULL AND expires_at > NOW() AND executed_at IS NULL`,
      [id]
    );
    if (sel.rows.length === 0) {
      const exists = await pool.query('SELECT id, applied_at, rejected_at, expires_at, executed_at, target_id, scope FROM admin_suggestions WHERE id = $1', [id]);
      if (exists.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Öneri bulunamadı' });
      }
      const e = exists.rows[0];
      if (e.executed_at) {
        governanceAssertions.assertNotExecutedTwice(e);
        return res.status(409).json({ success: false, error: 'Öneri zaten uygulandı (executed)', message: 'Suggestion already executed' });
      }
      if (e.rejected_at) {
        return res.status(409).json({ success: false, error: 'Öneri reddedilmiş', message: 'Suggestion was rejected' });
      }
      if (!e.applied_at) {
        governanceAssertions.assertAppliedBeforeExecute(e);
        return res.status(409).json({ success: false, error: 'Öneri henüz apply edilmemiş', message: 'Suggestion must be applied first' });
      }
      if (e.expires_at && new Date(e.expires_at) < new Date()) {
        return res.status(409).json({ success: false, error: 'Öneri süresi dolmuş', message: 'Suggestion expired' });
      }
      return res.status(409).json({ success: false, error: 'Çakışma', message: 'Suggestion state conflict' });
    }
    row = sel.rows[0];
    governanceAssertions.assertAppliedBeforeExecute(row);
    governanceAssertions.assertExecutionMatchesSuggestion(row.suggested_action, execution_action);
  } catch (err) {
    console.error('Admin execute suggestion load error:', err);
    return res.status(500).json({ success: false, error: 'Öneri yüklenemedi', message: err.message });
  }

  const scope = row.scope;
  const suggestion_type = (row.suggestion_type || '').toString();
  const suggested_action = (row.suggested_action || '').toString().toLowerCase();
  let allowedForThis = [];
  if (scope === 'source' && suggestion_type === 'SOURCE_STATUS' && ['backlog', 'hard_backlog'].includes(suggested_action)) {
    allowedForThis = ['change_source_status'];
  } else if (scope === 'campaign' && suggestion_type === 'CAMPAIGN_DEFAULT' && suggested_action === 'auto_low_value') {
    allowedForThis = ['downgrade_campaign'];
  } else if (scope === 'campaign' && suggested_action === 'hide') {
    allowedForThis = ['hide_campaign'];
  }
  if (!allowedForThis.includes(execution_action)) {
    return res.status(409).json({
      success: false,
      error: 'execution_action öneri ile uyuşmuyor',
      message: `execution_action "${execution_action}" is not valid for this suggestion (scope=${scope}, type=${suggestion_type}, suggested_action=${suggested_action})`,
    });
  }

  const suggestionSnapshot = {
    id: row.id,
    scope: row.scope,
    target_id: row.target_id,
    suggestion_type: row.suggestion_type,
    suggested_action: row.suggested_action,
    confidence: row.confidence,
    reason: row.reason,
    signals: row.signals || {},
    run_id: row.run_id,
    created_at: row.created_at,
    expires_at: row.expires_at,
  };
  const reason = 'admin_suggestion_execution';

  try {
    if (execution_action === 'change_source_status') {
      const src = await pool.query(
        'SELECT id FROM sources WHERE name = $1 OR id::text = $1 LIMIT 1',
        [String(row.target_id).trim(), String(row.target_id).trim()]
      );
      if (!src.rows[0]) {
        throw new Error('Source not found for target_id: ' + row.target_id);
      }
      const status = suggested_action === 'hard_backlog' ? 'hard_backlog' : 'backlog';
      await AdminSourceService.updateSourceStatus(src.rows[0].id, status, reason, req.admin);
    } else if (execution_action === 'downgrade_campaign') {
      await AdminCampaignService.changeCampaignType(row.target_id, 'low', req.admin, reason);
    } else if (execution_action === 'hide_campaign') {
      await AdminCampaignService.toggleHidden(row.target_id, true, req.admin, reason);
    }
  } catch (execErr) {
    await AuditLogService.logAdminAction({
      adminId,
      action: 'execution_failed',
      entityType: 'admin_suggestion_execution',
      entityId: id,
      metadata: {
        suggestion_snapshot: suggestionSnapshot,
        execution_action,
        admin_note,
        error: execErr.message,
        executed_at: new Date().toISOString(),
        executed_by: adminId,
      },
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('user-agent'),
    });
    return res.status(500).json({
      success: false,
      error: 'Çalıştırma başarısız',
      message: execErr.message,
    });
  }

  const executedAt = new Date().toISOString();
  governanceAssertions.assertExecutedAfterApplied(row, executedAt);
  await pool.query(
    'UPDATE admin_suggestions SET executed_at = NOW(), executed_by = $1 WHERE id = $2',
    [adminId, id]
  );
  await AuditLogService.logAdminAction({
    adminId,
    action: execution_action,
    entityType: 'admin_suggestion_execution',
    entityId: id,
    metadata: {
      suggestion_snapshot: suggestionSnapshot,
      execution_action,
      admin_note,
      executed_at: executedAt,
      executed_by: adminId,
    },
    ipAddress: req.ip || req.connection?.remoteAddress,
    userAgent: req.get('user-agent'),
  });

  res.json({
    success: true,
    data: { id, executed_at: executedAt, executed_by: adminId, execution_action },
  });
});

module.exports = router;
