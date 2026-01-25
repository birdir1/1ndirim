/**
 * FAZ 13.1–13.2: Campaign confidence signal (BOT-SUGGESTED only).
 * computeConfidence(campaign, runContext) → { confidence_score, confidence_reasons }
 * Backend is authority; bot only suggests.
 */

const DEFAULT_SCORE = 50;
const DEFAULT_REASONS = ['fallback_default'];

/**
 * @param {Object} campaign - has sourceName, optional _fromNetwork, optional selectorTier
 * @param {{ emptyResultSources?: Set|string[], domChangedSources?: Set|string[] }} runContext
 * @returns {{ confidence_score: number, confidence_reasons: string[] }}
 */
function computeConfidence(campaign, runContext = {}) {
  try {
    const reasons = [];
    let score = 50;

    const emptySet = runContext.emptyResultSources instanceof Set
      ? runContext.emptyResultSources
      : new Set(Array.isArray(runContext.emptyResultSources) ? runContext.emptyResultSources : []);
    const domSet = runContext.domChangedSources instanceof Set
      ? runContext.domChangedSources
      : new Set(Array.isArray(runContext.domChangedSources) ? runContext.domChangedSources : []);
    const src = (campaign.sourceName || '').trim();

    if (campaign._fromNetwork === true) {
      score += 40;
      reasons.push('network_data_used');
    }

    const tier = campaign.selectorTier || campaign.selector_tier;
    if (tier === 'primary') {
      score += 30;
      reasons.push('primary_selector_success');
    } else if (tier === 'secondary') {
      score += 20;
      reasons.push('secondary_selector_success');
    } else if (tier === 'fallback') {
      score += 15;
      reasons.push('fallback_selector_used');
      score -= 10;
    }

    if (emptySet.has(src)) {
      score -= 20;
      reasons.push('empty_result_prev_on_source');
    }
    if (domSet.has(src)) {
      score -= 20;
      reasons.push('dom_changed_earlier_in_run');
    }

    const clamped = Math.max(0, Math.min(100, Math.round(score)));
    return { confidence_score: clamped, confidence_reasons: reasons.length ? reasons : DEFAULT_REASONS };
  } catch (_) {
    return { confidence_score: DEFAULT_SCORE, confidence_reasons: DEFAULT_REASONS };
  }
}

/**
 * Enrich an array of campaigns with confidence_score and confidence_reasons.
 * On error per item or globally, uses fallback 50 / ["fallback_default"].
 * @param {Object[]} campaigns
 * @param {{ emptyResultSources?: Set|string[], domChangedSources?: Set|string[] }} runContext
 * @returns {Object[]} new array with confidence fields added (and _fromNetwork/selectorTier not stripped; backend may ignore)
 */
function enrichWithConfidence(campaigns, runContext) {
  if (!Array.isArray(campaigns)) return [];
  try {
    return campaigns.map((c) => {
      try {
        const { confidence_score, confidence_reasons } = computeConfidence(c, runContext);
        return { ...c, confidence_score, confidence_reasons };
      } catch (_) {
        return { ...c, confidence_score: DEFAULT_SCORE, confidence_reasons: DEFAULT_REASONS };
      }
    });
  } catch (_) {
    return campaigns.map((c) => ({
      ...c,
      confidence_score: DEFAULT_SCORE,
      confidence_reasons: DEFAULT_REASONS,
    }));
  }
}

module.exports = {
  computeConfidence,
  enrichWithConfidence,
  DEFAULT_SCORE,
  DEFAULT_REASONS,
};
