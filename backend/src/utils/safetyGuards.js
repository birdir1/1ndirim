/**
 * Safety Guards
 * FAZ 10: Final Safety Validation
 * 
 * Runtime assertions to ensure system integrity
 * Protects against:
 * - FAZ 6 filter bypass
 * - Main feed pollution
 * - Feed isolation violations
 * - Admin mistakes
 */

const { validateMainFeedResults } = require('./mainFeedGuard');
const { isHighQualityCampaign } = require('./campaignQualityFilter');

/**
 * Asserts FAZ 6 quality filter is unchanged
 * Validates that quality filter logic is intact
 * 
 * CRITICAL RULE: FAZ 6 quality filter MUST NOT be bypassed
 * - Low value campaigns should NOT pass quality filter
 * - Main feed campaigns should pass quality filter (warning if not)
 * 
 * @param {Object} campaign - Campaign to validate
 * @param {string} context - Context for error message
 * @throws {Error} If quality filter is bypassed
 */
function assertFAZ6FilterUnchanged(campaign, context = '') {
  // FAZ 6 filter should reject low-quality campaigns
  // If a low-quality campaign passes, filter is broken
  const isHighQuality = isHighQualityCampaign(campaign);
  
  // CRITICAL: If campaign has value_level = 'low', it should NOT pass quality filter
  if (campaign.value_level === 'low' && isHighQuality) {
    throw new Error(
      `❌ FAZ 6 FILTER VIOLATION ${context}: ` +
      `Campaign ${campaign.id || 'unknown'} with value_level='low' passed quality filter. ` +
      `This indicates quality filter logic is BROKEN. ` +
      `FAZ 6 quality filter MUST reject low value campaigns.`
    );
  }
  
  // If campaign is marked as low value but passes filter, inconsistency detected
  if (campaign.value_level === 'low') {
    // This is expected - low value campaigns should NOT pass quality filter
    // But they should be in low value feed, not main feed
    return; // OK - low value campaigns are expected to fail quality filter
  }
  
  // For main feed campaigns, quality filter should pass
  // (Warning only - filter may be too strict, but this is acceptable)
  if ((campaign.campaign_type === 'main' || campaign.campaign_type === null) &&
      campaign.value_level !== 'low' &&
      (campaign.value_level === 'high' || campaign.value_level === null) &&
      !isHighQuality) {
    // This is a warning, not an error - quality filter may reject valid campaigns
    // But we log it for monitoring
    console.warn(
      `⚠️ FAZ 6 FILTER WARNING ${context}: ` +
      `Campaign ${campaign.id || 'unknown'} is in main feed but failed quality filter. ` +
      `This may indicate filter is too strict or campaign data is incomplete. ` +
      `Campaign will still be served, but consider reviewing quality filter rules.`
    );
  }
}

/**
 * Asserts main feed is not polluted
 * Validates that main feed contains only valid campaigns
 * 
 * CRITICAL RULE: Main feed MUST contain only:
 * - campaign_type = 'main' OR NULL
 * - value_level = 'high' OR NULL
 * - is_hidden = false OR NULL
 * - campaign_type != 'hidden'
 * 
 * @param {Array} campaigns - Campaign results
 * @param {string} context - Context for error message
 * @throws {Error} If main feed is polluted
 */
function assertMainFeedNotPolluted(campaigns, context = '') {
  const validation = validateMainFeedResults(campaigns);
  
  if (!validation.valid) {
    const errorMessage = 
      `❌ MAIN FEED POLLUTION DETECTED ${context}:\n` +
      validation.errors.join('\n') +
      `\n\n🚨 CRITICAL ERROR: Main feed integrity is compromised. ` +
      `This indicates a serious system failure. ` +
      `Admin actions or database corruption may have polluted the main feed. ` +
      `Immediate investigation required.`;
    
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
}

/**
 * Asserts FAZ 7 feeds are isolated
 * Validates that light/category/low feeds don't contain main feed campaigns
 * 
 * @param {Array} campaigns - Campaign results
 * @param {string} feedType - Feed type (light, category, low)
 * @param {string} context - Context for error message
 * @throws {Error} If feed isolation is violated
 */
function assertFAZ7FeedIsolated(campaigns, feedType, context = '') {
  const errors = [];
  
  for (const campaign of campaigns) {
    // Light feed should only contain light campaigns
    if (feedType === 'light') {
      if (campaign.campaign_type !== 'light') {
        errors.push(
          `Campaign ${campaign.id}: campaign_type=${campaign.campaign_type} ` +
          `(expected 'light')`
        );
      }
      if (!campaign.show_in_light_feed) {
        errors.push(
          `Campaign ${campaign.id}: show_in_light_feed=false ` +
          `(expected true for light feed)`
        );
      }
    }
    
    // Category feed should only contain category campaigns
    if (feedType === 'category') {
      if (campaign.campaign_type !== 'category') {
        errors.push(
          `Campaign ${campaign.id}: campaign_type=${campaign.campaign_type} ` +
          `(expected 'category')`
        );
      }
      if (!campaign.show_in_category_feed) {
        errors.push(
          `Campaign ${campaign.id}: show_in_category_feed=false ` +
          `(expected true for category feed)`
        );
      }
    }
    
    // Low value feed should only contain low value campaigns
    if (feedType === 'low') {
      if (campaign.value_level !== 'low') {
        errors.push(
          `Campaign ${campaign.id}: value_level=${campaign.value_level} ` +
          `(expected 'low')`
        );
      }
    }
    
    // All FAZ 7 feeds should exclude hidden campaigns
    if (campaign.is_hidden === true || campaign.campaign_type === 'hidden') {
      errors.push(
        `Campaign ${campaign.id}: is_hidden=true or campaign_type='hidden' ` +
        `(hidden campaigns should not appear in any feed)`
      );
    }
  }
  
  if (errors.length > 0) {
    const errorMessage = 
      `FAZ 7 FEED ISOLATION VIOLATION ${context} (${feedType} feed):\n` +
      errors.join('\n') +
      `\n\nFeed isolation is compromised. ${feedType} feed contains invalid campaigns.`;
    
    console.error(`❌ ${errorMessage}`);
    throw new Error(errorMessage);
  }
}

/**
 * Asserts admin action doesn't pollute main feed
 * Validates campaign state after admin action
 * 
 * CRITICAL RULE: Admin actions MUST NOT pollute main feed
 * - If campaign is in main feed, it must meet all main feed requirements
 * - Admin actions that would violate main feed rules are blocked
 * 
 * @param {Object} campaign - Campaign after admin action
 * @param {string} action - Admin action type
 * @param {string} context - Context for error message
 * @throws {Error} If admin action would pollute main feed
 */
function assertAdminActionSafe(campaign, action, context = '') {
  // If campaign is in main feed, it must meet main feed requirements
  const isInMainFeed = 
    (campaign.campaign_type === 'main' || campaign.campaign_type === null) &&
    (campaign.value_level === 'high' || campaign.value_level === null) &&
    campaign.is_hidden !== true &&
    campaign.campaign_type !== 'hidden';
  
  if (isInMainFeed) {
    // Validate main feed requirements
    const validation = validateMainFeedResults([campaign]);
    
    if (!validation.valid) {
      const errorMessage = 
        `❌ ADMIN ACTION POLLUTION RISK ${context}:\n` +
        `Admin action '${action}' would pollute main feed:\n` +
        validation.errors.join('\n') +
        `\n\n🚨 CRITICAL: Admin action blocked to protect main feed integrity. ` +
        `Main feed rules CANNOT be bypassed, even by admin actions. ` +
        `Review admin action and ensure it complies with main feed requirements.`;
      
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
  }
}

/**
 * Asserts bot pipeline is untouched
 * Validates that bot pipeline logic is intact
 * 
 * CRITICAL RULE: Bot pipeline MUST NOT send admin-only states
 * - Bot should never set is_hidden=true (admin-only)
 * - Bot should never set campaign_type='hidden' (admin-only)
 * 
 * @param {Object} campaign - Campaign from bot
 * @param {string} context - Context for error message
 * @throws {Error} If bot pipeline is broken
 */
function assertBotPipelineUntouched(campaign, context = '') {
  // Bot should not send campaigns with invalid states
  if (campaign.is_hidden === true) {
    throw new Error(
      `❌ BOT PIPELINE VIOLATION ${context}: ` +
      `Bot sent campaign with is_hidden=true. ` +
      `Bot should NEVER set is_hidden=true (admin-only action). ` +
      `This indicates bot pipeline logic is broken or compromised.`
    );
  }
  
  // Bot should not send campaigns with campaign_type='hidden'
  if (campaign.campaign_type === 'hidden') {
    throw new Error(
      `❌ BOT PIPELINE VIOLATION ${context}: ` +
      `Bot sent campaign with campaign_type='hidden'. ` +
      `Bot should NEVER set campaign_type='hidden' (admin-only action). ` +
      `This indicates bot pipeline logic is broken or compromised.`
    );
  }
}

/**
 * Asserts fetch pipeline is isolated
 * Validates that fetch pipeline doesn't affect main feed
 * 
 * CRITICAL RULE: Fetch pipeline MUST be isolated from main feed
 * - Fetch pipeline should only send light/category campaigns
 * - Fetch pipeline should NEVER send main feed campaigns
 * - Main feed campaigns should come from regular bot pipeline only
 * 
 * @param {Array} campaigns - Campaigns from fetch pipeline
 * @param {string} context - Context for error message
 * @throws {Error} If fetch pipeline isolation is violated
 */
function assertFetchPipelineIsolated(campaigns, context = '') {
  // Fetch pipeline should only send light/category campaigns
  // It should NEVER send main feed campaigns
  for (const campaign of campaigns) {
    if (campaign.campaign_type === 'main' || campaign.campaign_type === null) {
      if (campaign.value_level !== 'low' && 
          (campaign.value_level === 'high' || campaign.value_level === null)) {
        throw new Error(
          `❌ FETCH PIPELINE ISOLATION VIOLATION ${context}: ` +
          `Fetch pipeline sent campaign ${campaign.id || 'unknown'} with campaign_type='main'. ` +
          `Fetch pipeline should ONLY send light/category campaigns. ` +
          `Main feed campaigns should come from regular bot pipeline only. ` +
          `This violates FAZ 7 feed isolation rules.`
        );
      }
    }
  }
}

/**
 * Comprehensive safety check
 * Runs all safety assertions
 * 
 * @param {Object} options - Safety check options
 * @param {Array} campaigns - Campaigns to validate
 * @param {string} feedType - Feed type (main, light, category, low)
 * @param {string} context - Context for error message
 */
function runSafetyChecks({ campaigns, feedType, context = '' }) {
  if (!campaigns || campaigns.length === 0) {
    return; // Empty results are safe
  }
  
  // Main feed safety checks
  if (feedType === 'main') {
    assertMainFeedNotPolluted(campaigns, context);
    
    // Validate each campaign
    for (const campaign of campaigns) {
      assertFAZ6FilterUnchanged(campaign, context);
      assertAdminActionSafe(campaign, 'query', context);
    }
  }
  
  // FAZ 7 feed isolation checks
  if (feedType === 'light' || feedType === 'category' || feedType === 'low') {
    assertFAZ7FeedIsolated(campaigns, feedType, context);
  }
}

module.exports = {
  assertFAZ6FilterUnchanged,
  assertMainFeedNotPolluted,
  assertFAZ7FeedIsolated,
  assertAdminActionSafe,
  assertBotPipelineUntouched,
  assertFetchPipelineIsolated,
  runSafetyChecks,
};
