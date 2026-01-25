/**
 * Main Feed Query Guard
 * FAZ 10: Admin & Control Layer
 * 
 * Protects main feed queries against admin mistakes
 * Ensures main feed ALWAYS enforces strict rules
 * 
 * CRITICAL RULES (KIRMIZI ÇİZGİLER):
 * - campaign_type = 'main' OR NULL
 * - value_level = 'high' OR NULL
 * - is_hidden = false OR NULL
 * 
 * These rules CANNOT be bypassed, even by admin actions
 */

/**
 * Main feed query guard
 * Returns SQL WHERE clause conditions that MUST be applied to main feed queries
 * 
 * @returns {string} SQL WHERE clause conditions
 */
function getMainFeedGuardConditions() {
  return `
    AND (c.campaign_type = 'main' OR c.campaign_type IS NULL)
    AND (c.campaign_type != 'category' OR c.campaign_type IS NULL)
    AND (c.campaign_type != 'light' OR c.campaign_type IS NULL)
    AND (c.campaign_type != 'hidden' OR c.campaign_type IS NULL)
    AND (c.value_level = 'high' OR c.value_level IS NULL)
    AND (c.is_hidden = false OR c.is_hidden IS NULL)
  `.trim();
}

/**
 * Builds main feed query with guard conditions
 * Ensures main feed rules are ALWAYS enforced
 * 
 * @param {string} baseQuery - Base SELECT query (without WHERE clause)
 * @param {Array} params - Query parameters array
 * @param {Array<string>} sourceIds - Optional source IDs filter
 * @returns {Object} { query: string, params: Array }
 */
function buildMainFeedQuery(baseQuery, params = [], sourceIds = null) {
  // Ensure base query ends properly
  let query = baseQuery.trim();
  
  // Add WHERE if not present
  if (!query.toUpperCase().includes('WHERE')) {
    query += ' WHERE 1=1';
  }
  
  // Add standard main feed conditions
  query += `
    AND c.is_active = true
    AND c.expires_at > NOW()
  `;
  
  // Add guard conditions (CRITICAL - cannot be bypassed)
  query += getMainFeedGuardConditions();
  
  // Add source filter if provided
  if (sourceIds && sourceIds.length > 0) {
    query += ` AND c.source_id = ANY($${params.length + 1}::uuid[])`;
    params.push(sourceIds);
  }
  
  // Add ordering
  query += ` ORDER BY c.is_pinned DESC, c.pinned_at DESC NULLS LAST, c.created_at DESC`;
  
  return { query, params };
}

/**
 * Validates main feed query result
 * Ensures no polluted campaigns are returned
 * 
 * @param {Array} campaigns - Campaign results
 * @returns {Object} { valid: boolean, errors: Array<string> }
 */
function validateMainFeedResults(campaigns) {
  const errors = [];
  
  for (const campaign of campaigns) {
    // Check campaign_type
    if (campaign.campaign_type && 
        campaign.campaign_type !== 'main' && 
        campaign.campaign_type !== null) {
      errors.push(`Campaign ${campaign.id}: Invalid campaign_type: ${campaign.campaign_type} (must be 'main' or NULL)`);
    }
    
    // Check value_level
    if (campaign.value_level && 
        campaign.value_level !== 'high' && 
        campaign.value_level !== null) {
      errors.push(`Campaign ${campaign.id}: Invalid value_level: ${campaign.value_level} (must be 'high' or NULL)`);
    }
    
    // Check is_hidden
    if (campaign.is_hidden === true) {
      errors.push(`Campaign ${campaign.id}: is_hidden is true (must be false or NULL)`);
    }
    
    // Check hidden campaign_type
    if (campaign.campaign_type === 'hidden') {
      errors.push(`Campaign ${campaign.id}: campaign_type is 'hidden' (forbidden in main feed)`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Asserts main feed query results are valid
 * Throws error if pollution detected
 * 
 * @param {Array} campaigns - Campaign results
 * @throws {Error} If main feed is polluted
 */
function assertMainFeedIntegrity(campaigns) {
  const validation = validateMainFeedResults(campaigns);
  
  if (!validation.valid) {
    const errorMessage = `Main feed pollution detected:\n${validation.errors.join('\n')}`;
    console.error('❌ MAIN FEED POLLUTION:', errorMessage);
    throw new Error(errorMessage);
  }
}

/**
 * Fail-safe main feed query executor
 * Executes query with guard, validates results, and returns safe results
 * 
 * @param {Function} queryExecutor - Function that executes the query
 * @param {string} baseQuery - Base SELECT query
 * @param {Array} params - Query parameters
 * @param {Array<string>} sourceIds - Optional source IDs
 * @param {boolean} validateResults - Whether to validate results (default: true)
 * @returns {Promise<Array>} Campaign results
 */
async function executeMainFeedQuery(queryExecutor, baseQuery, params = [], sourceIds = null, validateResults = true) {
  // Build query with guard
  const { query, params: finalParams } = buildMainFeedQuery(baseQuery, params, sourceIds);
  
  // Execute query
  const result = await queryExecutor(query, finalParams);
  const campaigns = result.rows || result;
  
  // Validate results if enabled
  if (validateResults) {
    const validation = validateMainFeedResults(campaigns);
    
    if (!validation.valid) {
      // Log error but don't throw (fail-safe: return empty array instead of breaking)
      console.error('❌ MAIN FEED POLLUTION DETECTED (fail-safe mode):', validation.errors);
      console.error('⚠️ Returning empty array to prevent pollution');
      
      // In production, you might want to alert monitoring system
      // For now, return empty array as fail-safe
      return [];
    }
  }
  
  return campaigns;
}

module.exports = {
  getMainFeedGuardConditions,
  buildMainFeedQuery,
  validateMainFeedResults,
  assertMainFeedIntegrity,
  executeMainFeedQuery,
};
