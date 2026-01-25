/**
 * FAZ 21.1: Governance Timeline (read-only).
 * Aggregates admin_audit_logs into a unified event stream.
 * No mutations, no recomputation.
 */

const pool = require('../config/database');

const SUGGESTION_EVENTS = new Set(['ingest', 'apply', 'reject']);
const EXECUTION_EVENTS = new Set(['change_source_status', 'downgrade_campaign', 'hide_campaign', 'execution_failed']);

function toEventType(entityType, action) {
  if (entityType === 'admin_suggestion') {
    if (action === 'ingest') return 'suggestion_ingested';
    if (action === 'apply') return 'suggestion_applied';
    if (action === 'reject') return 'suggestion_rejected';
  }
  if (entityType === 'admin_suggestion_execution') {
    if (EXECUTION_EVENTS.has(action)) return action === 'execution_failed' ? 'suggestion_execution_failed' : 'suggestion_executed';
  }
  return 'admin_action';
}

function pickScopeTargetRunConfidence(metadata, fallbackScope, fallbackTargetId) {
  const m = metadata || {};
  const snap = m.suggestion_snapshot || m;
  return {
    scope: snap.scope || fallbackScope || null,
    target_id: snap.target_id || m.target_id || fallbackTargetId || null,
    run_id: snap.run_id || m.run_id || null,
    confidence: snap.confidence != null ? Number(snap.confidence) : (m.confidence != null ? Number(m.confidence) : null),
  };
}

/**
 * @param {Object} opts - { limit, offset }
 * @returns {Promise<{ events: Array<Object>, total?: number }>}
 */
async function getTimeline(opts = {}) {
  const limit = Math.min(Math.max(1, parseInt(opts.limit, 10) || 50), 200);
  const offset = Math.max(0, parseInt(opts.offset, 10) || 0);

  const query = `
    SELECT a.id, a.admin_id, a.action, a.entity_type, a.entity_id, a.reason, a.metadata, a.created_at,
           au.email AS admin_email
    FROM admin_audit_logs a
    LEFT JOIN admin_users au ON au.id::text = a.admin_id
    ORDER BY a.created_at DESC
    LIMIT $1 OFFSET $2
  `;
  const result = await pool.query(query, [limit, offset]);
  const events = [];

  for (const row of result.rows) {
    const meta = row.metadata && typeof row.metadata === 'object' ? row.metadata : (typeof row.metadata === 'string' ? (() => { try { return JSON.parse(row.metadata); } catch { return {}; } })() : {});
    const eventType = toEventType(row.entity_type, row.action);
    const { scope, target_id, run_id, confidence } = pickScopeTargetRunConfidence(
      meta,
      null,
      row.entity_id
    );
    events.push({
      timestamp: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
      event_type: eventType,
      scope: scope || (row.entity_type === 'source' ? 'source' : row.entity_type === 'campaign' ? 'campaign' : null),
      target_id: target_id || String(row.entity_id || ''),
      actor: row.admin_email || row.admin_id || null,
      action: row.action,
      reason: row.reason || meta.admin_note || null,
      run_id: run_id || null,
      confidence: confidence ?? null,
      metadata: meta,
    });
  }

  return { events };
}

module.exports = { getTimeline, toEventType, pickScopeTargetRunConfidence };
