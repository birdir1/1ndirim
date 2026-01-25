/**
 * FAZ 21.3: Governance safety assertions (log-only, no throw).
 * Used inside the execute endpoint only.
 * No request rejection — ONLY logs.
 */

/**
 * Log ERROR if suggestion was executed without a prior apply.
 * @param {Object} row - admin_suggestions row
 */
function assertAppliedBeforeExecute(row) {
  if (!row) return;
  if (!row.applied_at) {
    console.error('[GOVERNANCE ASSERT] ERROR: Suggestion executed without prior apply', {
      suggestion_id: row.id,
      target_id: row.target_id,
      scope: row.scope,
    });
  }
}

/**
 * Log ERROR if executed_at < applied_at (timestamp ordering).
 * @param {Object} row - admin_suggestions row (before execution update)
 * @param {string} executedAt - new executed_at ISO string
 */
function assertExecutedAfterApplied(row, executedAt) {
  if (!row || !row.applied_at || !executedAt) return;
  const applied = new Date(row.applied_at).getTime();
  const executed = new Date(executedAt).getTime();
  if (executed < applied) {
    console.error('[GOVERNANCE ASSERT] ERROR: executed_at < applied_at', {
      suggestion_id: row.id,
      applied_at: row.applied_at,
      executed_at: executedAt,
    });
  }
}

/**
 * Log ERROR if same suggestion executed twice (call when we detect already executed).
 * @param {Object} row - admin_suggestions row with executed_at set
 */
function assertNotExecutedTwice(row) {
  if (!row) return;
  if (row.executed_at) {
    console.error('[GOVERNANCE ASSERT] ERROR: Same suggestion executed twice (attempt blocked)', {
      suggestion_id: row.id,
      target_id: row.target_id,
      previous_executed_at: row.executed_at,
    });
  }
}

/**
 * Log WARN if execution_action does not match suggested_action (semantic mismatch).
 * @param {string} suggestedAction - suggested_action from row
 * @param {string} executionAction - execution_action from request
 */
function assertExecutionMatchesSuggestion(suggestedAction, executionAction) {
  if (suggestedAction == null || executionAction == null) return;
  const s = String(suggestedAction).toLowerCase();
  const e = String(executionAction);
  const match = (
    (e === 'change_source_status' && (s === 'backlog' || s === 'hard_backlog')) ||
    (e === 'downgrade_campaign' && s === 'auto_low_value') ||
    (e === 'hide_campaign' && s === 'hide')
  );
  if (!match) {
    console.warn('[GOVERNANCE ASSERT] WARN: execution_action != suggested_action', {
      suggested_action: suggestedAction,
      execution_action: executionAction,
    });
  }
}

module.exports = {
  assertAppliedBeforeExecute,
  assertExecutedAfterApplied,
  assertNotExecutedTwice,
  assertExecutionMatchesSuggestion,
};
