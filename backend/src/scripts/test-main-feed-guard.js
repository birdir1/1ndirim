/**
 * Main Feed Guard Test Script
 * FAZ 10: Admin & Control Layer
 * 
 * Tests main feed guard protection against pollution
 * Verifies guard cannot be bypassed
 */

const pool = require('../../config/database');
const Campaign = require('../../models/Campaign');
const { 
  validateMainFeedResults, 
  assertMainFeedIntegrity,
  getMainFeedGuardConditions 
} = require('../../utils/mainFeedGuard');

async function testMainFeedGuard() {
  console.log('🧪 Main Feed Guard Test Başlatılıyor...\n');
  
  try {
    // Test 1: Verify guard conditions
    console.log('Test 1: Guard Conditions');
    const guardConditions = getMainFeedGuardConditions();
    console.log('✅ Guard conditions:', guardConditions);
    console.log('');
    
    // Test 2: Query main feed
    console.log('Test 2: Query Main Feed');
    const campaigns = await Campaign.findAll();
    console.log(`✅ Main feed returned ${campaigns.length} campaigns`);
    console.log('');
    
    // Test 3: Validate results
    console.log('Test 3: Validate Results');
    const validation = validateMainFeedResults(campaigns);
    
    if (validation.valid) {
      console.log('✅ Main feed is clean (no pollution detected)');
    } else {
      console.error('❌ Main feed pollution detected:');
      validation.errors.forEach(error => console.error(`  - ${error}`));
      throw new Error('Main feed pollution detected');
    }
    console.log('');
    
    // Test 4: Assert integrity
    console.log('Test 4: Assert Integrity');
    try {
      assertMainFeedIntegrity(campaigns);
      console.log('✅ Main feed integrity assertion passed');
    } catch (error) {
      console.error('❌ Main feed integrity assertion failed:', error.message);
      throw error;
    }
    console.log('');
    
    // Test 5: Check for forbidden campaign types
    console.log('Test 5: Check Forbidden Campaign Types');
    const forbiddenTypes = ['light', 'category', 'hidden', 'low'];
    const forbiddenInMainFeed = campaigns.filter(c => 
      forbiddenTypes.includes(c.campaign_type)
    );
    
    if (forbiddenInMainFeed.length > 0) {
      console.error('❌ Forbidden campaign types found in main feed:');
      forbiddenInMainFeed.forEach(c => {
        console.error(`  - Campaign ${c.id}: campaign_type = ${c.campaign_type}`);
      });
      throw new Error('Forbidden campaign types in main feed');
    } else {
      console.log('✅ No forbidden campaign types in main feed');
    }
    console.log('');
    
    // Test 6: Check for hidden campaigns
    console.log('Test 6: Check Hidden Campaigns');
    const hiddenCampaigns = campaigns.filter(c => c.is_hidden === true);
    
    if (hiddenCampaigns.length > 0) {
      console.error('❌ Hidden campaigns found in main feed:');
      hiddenCampaigns.forEach(c => {
        console.error(`  - Campaign ${c.id}: is_hidden = ${c.is_hidden}`);
      });
      throw new Error('Hidden campaigns in main feed');
    } else {
      console.log('✅ No hidden campaigns in main feed');
    }
    console.log('');
    
    // Test 7: Check for low value campaigns
    console.log('Test 7: Check Low Value Campaigns');
    const lowValueCampaigns = campaigns.filter(c => 
      c.value_level === 'low' && c.value_level !== null
    );
    
    if (lowValueCampaigns.length > 0) {
      console.error('❌ Low value campaigns found in main feed:');
      lowValueCampaigns.forEach(c => {
        console.error(`  - Campaign ${c.id}: value_level = ${c.value_level}`);
      });
      throw new Error('Low value campaigns in main feed');
    } else {
      console.log('✅ No low value campaigns in main feed');
    }
    console.log('');
    
    console.log('✅ Tüm testler başarılı! Main feed guard çalışıyor.');
    
  } catch (error) {
    console.error('❌ Test başarısız:', error.message);
    process.exit(1);
  }
}

// Run test
if (require.main === module) {
  testMainFeedGuard()
    .then(() => {
      console.log('\n✅ Test tamamlandı');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test hatası:', error);
      process.exit(1);
    });
}

module.exports = testMainFeedGuard;
