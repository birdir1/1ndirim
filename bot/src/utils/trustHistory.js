/**
 * FAZ 14.3–14.6: Last-3-run STS memory, backlog suggestions (log only), learning safety.
 * In-memory only. No DB, no API. Admin remains authority.
 */

const MAX_RUNS = 3;
const BACKLOG_THRESHOLD = 40;
const LEARNING_DISABLE_AFTER_EXCEPTIONS = 3;

let lastStsRuns = [];
let learningExceptionCount = 0;
let learningDisabled = false;

function isLearningDisabled() {
  return learningDisabled;
}

function recordLearningSuccess() {
  learningExceptionCount = 0;
}

function recordLearningException() {
  learningExceptionCount += 1;
  if (learningExceptionCount >= LEARNING_DISABLE_AFTER_EXCEPTIONS) {
    learningDisabled = true;
  }
}

/**
 * Append this run's STS list; keep only last MAX_RUNS.
 * @param {Array<{ source_name: string, source_trust_score: number, signals: object }>} stsList
 */
function pushRunSts(stsList) {
  if (!Array.isArray(stsList)) return;
  try {
    lastStsRuns.push(stsList.map((s) => ({ ...s, signals: { ...(s.signals || {}) } })));
    if (lastStsRuns.length > MAX_RUNS) {
      lastStsRuns = lastStsRuns.slice(-MAX_RUNS);
    }
  } catch (_) {}
}

/**
 * FAZ 14.3–14.4: Sources with avg STS < BACKLOG_THRESHOLD over last runs.
 * @returns {Array<{ source_name: string, suggested_status: string, average_trust_score: number, runs: number[], signals: object }>}
 */
function getSuggestions() {
  if (lastStsRuns.length === 0) return [];
  const bySource = {};
  for (const run of lastStsRuns) {
    for (const item of run) {
      const n = item && item.source_name;
      if (!n) continue;
      if (!bySource[n]) bySource[n] = { scores: [], lastSignals: item.signals };
      bySource[n].scores.push(item.source_trust_score);
      bySource[n].lastSignals = item.signals;
    }
  }
  const out = [];
  for (const [source_name, data] of Object.entries(bySource)) {
    const runs = data.scores;
    const average_trust_score = runs.reduce((a, b) => a + b, 0) / runs.length;
    if (average_trust_score < BACKLOG_THRESHOLD) {
      out.push({
        source_name,
        suggested_status: 'backlog',
        average_trust_score: Math.round(average_trust_score * 10) / 10,
        runs,
        signals: data.lastSignals || {},
      });
    }
  }
  return out;
}

module.exports = {
  pushRunSts,
  getSuggestions,
  isLearningDisabled,
  recordLearningSuccess,
  recordLearningException,
  BACKLOG_THRESHOLD,
};
