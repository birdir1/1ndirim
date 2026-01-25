/**
 * Campaign Explain Service
 * FAZ 10: Admin & Control Layer
 * 
 * Explains why a campaign is or is not in main feed
 * Pure diagnostics - read-only, no mutations
 */

const pool = require('../config/database');
const { validateMainFeedResults } = require('../utils/mainFeedGuard');

class CampaignExplainService {
  /**
   * Explains campaign's main feed status
   * Analyzes campaign and explains why it's in or out of main feed
   * 
   * @param {string} campaignId - Campaign ID
   * @returns {Promise<Object>} Explanation object
   */
  static async explainCampaign(campaignId) {
    // Get campaign details
    const result = await pool.query(
      `SELECT 
        c.*,
        s.name as source_name,
        s.type as source_type,
        s.logo_url as source_logo_url
      FROM campaigns c
      INNER JOIN sources s ON c.source_id = s.id
      WHERE c.id = $1`,
      [campaignId]
    );
    
    if (result.rows.length === 0) {
      throw new Error('Campaign not found');
    }
    
    const campaign = result.rows[0];
    
    // Analyze campaign against main feed rules
    const analysis = this.analyzeMainFeedEligibility(campaign);
    
    // Build explanation
    const explanation = {
      campaign_id: campaign.id,
      campaign_title: campaign.title,
      source_name: campaign.source_name,
      
      // Current state
      current_state: {
        campaign_type: campaign.campaign_type || null,
        value_level: campaign.value_level || null,
        is_hidden: campaign.is_hidden || false,
        is_pinned: campaign.is_pinned || false,
        is_active: campaign.is_active,
        expires_at: campaign.expires_at,
        show_in_light_feed: campaign.show_in_light_feed || false,
        show_in_category_feed: campaign.show_in_category_feed || false,
      },
      
      // Main feed eligibility
      main_feed_eligible: analysis.eligible,
      in_main_feed: analysis.inMainFeed,
      
      // Blocking rules
      blocking_rules: analysis.blockingRules,
      passing_rules: analysis.passingRules,
      
      // Rule details
      rule_analysis: analysis.ruleAnalysis,
      
      // Recommendations
      recommendations: analysis.recommendations,
      
      // Feed assignments
      feed_assignments: this.getFeedAssignments(campaign),
    };
    
    return explanation;
  }
  
  /**
   * Analyzes campaign against main feed rules
   * 
   * @param {Object} campaign - Campaign object
   * @returns {Object} Analysis result
   */
  static analyzeMainFeedEligibility(campaign) {
    const blockingRules = [];
    const passingRules = [];
    const ruleAnalysis = {};
    const recommendations = [];
    
    // Rule 1: is_active
    if (!campaign.is_active) {
      blockingRules.push({
        rule: 'is_active',
        reason: 'Campaign is not active',
        current_value: campaign.is_active,
        required_value: true,
        severity: 'blocking',
      });
      ruleAnalysis.is_active = {
        passed: false,
        current: campaign.is_active,
        required: true,
        message: 'Campaign must be active',
      };
    } else {
      passingRules.push('is_active');
      ruleAnalysis.is_active = {
        passed: true,
        current: campaign.is_active,
        required: true,
      };
    }
    
    // Rule 2: expires_at
    const now = new Date();
    const expiresAt = campaign.expires_at ? new Date(campaign.expires_at) : null;
    if (!expiresAt || expiresAt <= now) {
      blockingRules.push({
        rule: 'expires_at',
        reason: expiresAt ? 'Campaign has expired' : 'Campaign has no expiry date',
        current_value: campaign.expires_at,
        required_value: 'Future date',
        severity: 'blocking',
      });
      ruleAnalysis.expires_at = {
        passed: false,
        current: campaign.expires_at,
        required: 'Future date',
        message: expiresAt ? 'Campaign has expired' : 'Campaign has no expiry date',
      };
    } else {
      passingRules.push('expires_at');
      ruleAnalysis.expires_at = {
        passed: true,
        current: campaign.expires_at,
        required: 'Future date',
      };
    }
    
    // Rule 3: is_hidden
    if (campaign.is_hidden === true) {
      blockingRules.push({
        rule: 'is_hidden',
        reason: 'Campaign is hidden',
        current_value: campaign.is_hidden,
        required_value: false,
        severity: 'blocking',
      });
      ruleAnalysis.is_hidden = {
        passed: false,
        current: campaign.is_hidden,
        required: false,
        message: 'Campaign is hidden (admin override)',
      };
      recommendations.push('Unhide campaign to make it visible in feeds');
    } else {
      passingRules.push('is_hidden');
      ruleAnalysis.is_hidden = {
        passed: true,
        current: campaign.is_hidden || false,
        required: false,
      };
    }
    
    // Rule 4: campaign_type = 'main' OR NULL
    const campaignType = campaign.campaign_type;
    if (campaignType && campaignType !== 'main') {
      blockingRules.push({
        rule: 'campaign_type',
        reason: `Campaign type is '${campaignType}', not 'main'`,
        current_value: campaignType,
        required_value: "'main' or NULL",
        severity: 'blocking',
      });
      ruleAnalysis.campaign_type = {
        passed: false,
        current: campaignType,
        required: "'main' or NULL",
        message: `Campaign type '${campaignType}' is not allowed in main feed`,
      };
      
      if (campaignType === 'light') {
        recommendations.push('Campaign is in light feed. To move to main feed, change campaign_type to "main" (requires quality filter pass)');
      } else if (campaignType === 'category') {
        recommendations.push('Campaign is in category feed. To move to main feed, change campaign_type to "main" (requires quality filter pass)');
      } else if (campaignType === 'hidden') {
        recommendations.push('Campaign is hidden. Cannot be moved to main feed directly. Requires super_admin to reverse hidden status.');
      } else if (campaignType === 'low') {
        recommendations.push('Campaign is in low value feed. To move to main feed, change campaign_type to "main" (requires quality filter pass)');
      }
    } else {
      passingRules.push('campaign_type');
      ruleAnalysis.campaign_type = {
        passed: true,
        current: campaignType || null,
        required: "'main' or NULL",
      };
    }
    
    // Rule 5: value_level = 'high' OR NULL
    const valueLevel = campaign.value_level;
    if (valueLevel && valueLevel !== 'high') {
      blockingRules.push({
        rule: 'value_level',
        reason: `Value level is '${valueLevel}', not 'high'`,
        current_value: valueLevel,
        required_value: "'high' or NULL",
        severity: 'blocking',
      });
      ruleAnalysis.value_level = {
        passed: false,
        current: valueLevel,
        required: "'high' or NULL",
        message: `Value level '${valueLevel}' is not allowed in main feed`,
      };
      recommendations.push('Change value_level to "high" to make campaign eligible for main feed');
    } else {
      passingRules.push('value_level');
      ruleAnalysis.value_level = {
        passed: true,
        current: valueLevel || null,
        required: "'high' or NULL",
      };
    }
    
    // Determine if campaign is in main feed
    const eligible = blockingRules.length === 0;
    
    // Check if campaign would actually appear in main feed query
    const testCampaigns = [campaign];
    const validation = validateMainFeedResults(testCampaigns);
    const inMainFeed = eligible && validation.valid;
    
    return {
      eligible,
      inMainFeed,
      blockingRules,
      passingRules,
      ruleAnalysis,
      recommendations,
    };
  }
  
  /**
   * Gets feed assignments for campaign
   * Determines which feeds campaign would appear in
   * 
   * @param {Object} campaign - Campaign object
   * @returns {Object} Feed assignments
   */
  static getFeedAssignments(campaign) {
    const assignments = {
      main_feed: false,
      light_feed: false,
      category_feed: false,
      low_value_feed: false,
      hidden: false,
    };
    
    const now = new Date();
    const expiresAt = campaign.expires_at ? new Date(campaign.expires_at) : null;
    const isExpired = !expiresAt || expiresAt <= now;
    
    // Hidden (highest priority - if hidden, appears nowhere)
    if (campaign.campaign_type === 'hidden' || campaign.is_hidden === true) {
      assignments.hidden = true;
      return assignments; // Hidden campaigns don't appear in any feed
    }
    
    // Main feed
    if (campaign.is_active === true &&
        !isExpired &&
        (campaign.campaign_type === 'main' || campaign.campaign_type === null) &&
        (campaign.campaign_type !== 'category') &&
        (campaign.campaign_type !== 'light') &&
        (campaign.campaign_type !== 'hidden') &&
        (campaign.value_level === 'high' || campaign.value_level === null) &&
        campaign.is_hidden !== true) {
      assignments.main_feed = true;
    }
    
    // Light feed
    if (campaign.is_active === true &&
        !isExpired &&
        campaign.campaign_type === 'light' &&
        campaign.show_in_light_feed === true &&
        campaign.is_hidden !== true) {
      assignments.light_feed = true;
    }
    
    // Category feed
    if (campaign.is_active === true &&
        !isExpired &&
        campaign.campaign_type === 'category' &&
        campaign.show_in_category_feed === true &&
        campaign.is_hidden !== true) {
      assignments.category_feed = true;
    }
    
    // Low value feed
    if (campaign.is_active === true &&
        !isExpired &&
        campaign.value_level === 'low' &&
        campaign.is_hidden !== true) {
      assignments.low_value_feed = true;
    }
    
    return assignments;
  }
}

module.exports = CampaignExplainService;
