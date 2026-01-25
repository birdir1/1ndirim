/**
 * FAZ 18.1–18.2: Admin Suggestion Engine (pure logic, no side effects).
 * Transforms run intelligence into structured admin suggestions.
 * Admin is the ONLY authority; bot only suggests. Nothing is applied automatically.
 */

const crypto = require('crypto');

function newId() {
  return typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
}

/**
 * Build one suggestion in the strict payload format (FAZ 18.2).
 * @param {Object} p - { scope, target_id, suggestion_type, suggested_action, reason, signals, negativeSignals, run_id }
 */
function toPayload(p) {
  const now = new Date().toISOString();
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const confidence = Math.max(20, Math.min(100, 100 - ((p.negativeSignals || 1) * 15)));
  return {
    suggestion_id: newId(),
    scope: p.scope,
    target_id: p.target_id,
    suggestion_type: p.suggestion_type,
    suggested_action: p.suggested_action,
    confidence,
    reason: p.reason,
    signals: p.signals || {},
    created_at: now,
    run_id: p.run_id || null,
    expires_at: expires,
  };
}

/**
 * FAZ 18.1: Generate admin suggestions from run intelligence.
 * Deterministic, ordered, explainable. No DB, no API, no status change.
 *
 * @param {Object} opts
 * @param {Array<{ source_name: string, source_trust_score: number, signals: { dom_changed?: number, network_blocked?: number } }>} opts.sourceTrustScores
 * @param {Object} [opts.failureStats] - optional; if omitted, dom_changed/network_blocked taken from sourceTrustScores[].signals
 * @param {{ bySource: Object<string, Array<{ campaign_id?, confidence_score?, backend_action? }>> }} opts.confidenceFeedback
 * @param {{ bySource: Object<string, Array<{ applied_action?, admin_action_type? }>> }} opts.adminFeedback
 * @param {{ run_id: string }} opts.runContext
 * @returns {Array<Object>} suggestions in strict schema
 */
function generateAdminSuggestions(opts) {
  const {
    sourceTrustScores = [],
    failureStats,
    confidenceFeedback = { bySource: {} },
    adminFeedback = { bySource: {} },
    runContext = {},
  } = opts;
  void failureStats; // optional; when omitted, dom_changed/network_blocked from sourceTrustScores[].signals
  const run_id = (runContext && runContext.run_id) || null;
  const out = [];

  for (const sts of sourceTrustScores) {
    const name = sts && sts.source_name;
    const score = (sts && sts.source_trust_score) != null ? Number(sts.source_trust_score) : 100;
    const signals = (sts && sts.signals) || {};
    const dom_changed = Math.max(0, parseInt(signals.dom_changed, 10) || 0);
    const network_blocked = Math.max(0, parseInt(signals.network_blocked, 10) || 0);

    if (name == null) continue;

    // Rule 2: critical trust
    if (score < 25) {
      out.push(toPayload({
        scope: 'source',
        target_id: name,
        suggestion_type: 'SOURCE_STATUS',
        suggested_action: 'hard_backlog',
        reason: 'critical_trust_score',
        signals: { source_trust_score: score, dom_changed, network_blocked },
        negativeSignals: 1,
        run_id,
      }));
      continue;
    }

    // Rule 1: low trust + instability
    if (score < 40 && (dom_changed >= 2 || network_blocked >= 1)) {
      out.push(toPayload({
        scope: 'source',
        target_id: name,
        suggestion_type: 'SOURCE_STATUS',
        suggested_action: 'backlog',
        reason: 'low_trust_and_instability',
        signals: { source_trust_score: score, dom_changed, network_blocked },
        negativeSignals: 2,
        run_id,
      }));
    }
  }

  // Rule 3: campaign-level — repeated low confidence + admin downgrades
  const cfBySource = (confidenceFeedback && confidenceFeedback.bySource) || {};
  const afBySource = (adminFeedback && adminFeedback.bySource) || {};
  for (const sourceName of Object.keys(cfBySource)) {
    const adminEntries = afBySource[sourceName] || [];
    const downgradeCount = adminEntries.filter(
      (e) => (e.applied_action && String(e.applied_action).toLowerCase() === 'downgrade') ||
        (e.admin_action_type && String(e.admin_action_type).toLowerCase() === 'downgrade')
    ).length;
    if (downgradeCount < 2) continue;

    const items = cfBySource[sourceName] || [];
    for (const item of items) {
      const conf = item && item.confidence_score != null ? Number(item.confidence_score) : 100;
      if (conf >= 35) continue;
      const campaignId = (item && (item.campaign_id != null ? String(item.campaign_id) : null)) || null;
      out.push(toPayload({
        scope: 'campaign',
        target_id: campaignId || sourceName,
        suggestion_type: 'CAMPAIGN_DEFAULT',
        suggested_action: 'auto_low_value',
        reason: 'repeated_low_confidence',
        signals: { confidence_score: conf, downgrade_count: downgradeCount, source: sourceName },
        negativeSignals: 2,
        run_id,
      }));
    }
  }

  return out;
}

module.exports = {
  generateAdminSuggestions,
  toPayload,
};
