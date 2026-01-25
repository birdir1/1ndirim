/**
 * FAZ 12.1: Failure classification (BOT-SIDE ONLY).
 * classifyError(error, context) → failure_type string.
 */

const FAILURE_TYPES = {
  NETWORK_BLOCKED: 'NETWORK_BLOCKED',
  DOM_CHANGED: 'DOM_CHANGED',
  EMPTY_RESULT: 'EMPTY_RESULT',
  TIMEOUT: 'TIMEOUT',
  UNEXPECTED_ERROR: 'UNEXPECTED_ERROR',
};

/**
 * @param {Error|{ message?: string, failureType?: string, code?: string }} error
 * @param {{ sourceName?: string, phase?: 'network'|'dom'|'prefilter', selectorUsed?: string }} context
 * @returns {string} one of FAILURE_TYPES
 */
function classifyError(error, context = {}) {
  try {
    if (!error) return FAILURE_TYPES.UNEXPECTED_ERROR;
    const msg = (error.message || String(error)).toLowerCase();
    const phase = (context.phase || 'dom');

    if (error.failureType && Object.values(FAILURE_TYPES).includes(error.failureType)) {
      return error.failureType;
    }
    if (error.code === 'DOM_CHANGED' || msg.includes('dom_changed') || msg.includes('all selector tiers failed')) {
      return FAILURE_TYPES.DOM_CHANGED;
    }
    if (
      msg.includes('timeout') ||
      msg.includes('time-out') ||
      msg.includes('timed out') ||
      (error.name && error.name.toLowerCase().includes('timeout'))
    ) {
      return FAILURE_TYPES.TIMEOUT;
    }
    if (
      msg.includes('net::') ||
      msg.includes('econnrefused') ||
      msg.includes('enotfound') ||
      msg.includes('network') ||
      (msg.includes('fetch') && (msg.includes('failed') || msg.includes('error')))
    ) {
      return FAILURE_TYPES.NETWORK_BLOCKED;
    }
    if (phase === 'network') {
      return FAILURE_TYPES.NETWORK_BLOCKED;
    }
    return FAILURE_TYPES.UNEXPECTED_ERROR;
  } catch (_) {
    return FAILURE_TYPES.UNEXPECTED_ERROR;
  }
}

module.exports = {
  FAILURE_TYPES,
  classifyError,
};
