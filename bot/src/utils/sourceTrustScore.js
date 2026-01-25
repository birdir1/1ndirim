/**
 * FAZ 14.1: Source Trust Score (STS) — rule-based, explainable, per-run only.
 * Bot NEVER changes source_status; STS is for learning/logging. Admin remains authority.
 */

/**
 * Deterministic STS formula (example from spec):
 * Start at 100
 * −20 if avg_confidence < 50
 * −15 if low_confidence_ratio > 0.3
 * −10 per DOM_CHANGED
 * −15 per NETWORK_BLOCKED
 * −20 if EMPTY_RESULT twice in same run
 *
 * @param {string} sourceName
 * @param {{ avg_confidence?: number, low_confidence_ratio?: number, dom_changed?: number, network_blocked?: number, empty_result_count?: number }} signals
 * @returns {{ source_name: string, source_trust_score: number, signals: object }}
 */
function computeSourceTrustScore(sourceName, signals) {
  const avg = signals.avg_confidence != null ? Number(signals.avg_confidence) : 50;
  const lowRatio = signals.low_confidence_ratio != null ? Number(signals.low_confidence_ratio) : 0;
  const domChanged = Math.max(0, parseInt(signals.dom_changed, 10) || 0);
  const networkBlocked = Math.max(0, parseInt(signals.network_blocked, 10) || 0);
  const emptyCount = Math.max(0, parseInt(signals.empty_result_count, 10) || 0);

  let score = 100;
  if (avg < 50) score -= 20;
  if (lowRatio > 0.3) score -= 15;
  score -= domChanged * 10;
  score -= networkBlocked * 15;
  if (emptyCount >= 2) score -= 20;

  // FAZ 14.6: max trust drop per run = 40 → floor 60
  score = Math.max(60, score);
  score = Math.max(0, Math.min(100, score));

  const outSignals = {
    avg_confidence: Math.round(avg),
    low_confidence_ratio: Math.round(lowRatio * 100) / 100,
    dom_changed: domChanged,
    network_blocked: networkBlocked,
    empty_result: emptyCount >= 2,
    empty_result_count: emptyCount,
  };
  return {
    source_name: sourceName,
    source_trust_score: score,
    signals: outSignals,
  };
}

/**
 * Build per-source signals from runSummary and return STS for every source that has data.
 * @param {Object} runSummary - has errors[], bySource?, scraped[]
 * @param {Object} FAILURE_TYPES - { EMPTY_RESULT, DOM_CHANGED, NETWORK_BLOCKED }
 * @returns {Array<{ source_name: string, source_trust_score: number, signals: object }>}
 */
function computeAllFromRunSummary(runSummary, FAILURE_TYPES) {
  const bySource = runSummary.bySource || {};
  const errors = runSummary.errors || [];
  const sourceNames = new Set([
    ...(runSummary.scraped || []),
    ...errors.map((e) => e && e.sourceName).filter(Boolean),
  ]);

  const domBySource = {};
  const netBySource = {};
  const emptyBySource = {};
  for (const e of errors) {
    const n = e && e.sourceName;
    if (!n) continue;
    const t = e.failure_type;
    if (t === FAILURE_TYPES.DOM_CHANGED) {
      domBySource[n] = (domBySource[n] || 0) + 1;
    } else if (t === FAILURE_TYPES.NETWORK_BLOCKED) {
      netBySource[n] = (netBySource[n] || 0) + 1;
    } else if (t === FAILURE_TYPES.EMPTY_RESULT) {
      emptyBySource[n] = (emptyBySource[n] || 0) + 1;
    }
  }

  const result = [];
  for (const name of sourceNames) {
    const src = bySource[name] || {};
    const count = src.confidenceCount || 0;
    const sum = src.confidenceSum != null ? src.confidenceSum : 0;
    const lowCount = src.lowConfidenceCount || 0;
    const avg = count > 0 ? sum / count : 50;
    const lowRatio = count > 0 ? lowCount / count : 0;
    const sts = computeSourceTrustScore(name, {
      avg_confidence: avg,
      low_confidence_ratio: lowRatio,
      dom_changed: domBySource[name] || 0,
      network_blocked: netBySource[name] || 0,
      empty_result_count: emptyBySource[name] || 0,
    });
    result.push(sts);
  }
  return result;
}

module.exports = {
  computeSourceTrustScore,
  computeAllFromRunSummary,
};
