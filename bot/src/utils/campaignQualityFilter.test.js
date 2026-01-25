/**
 * Campaign Quality Filter Test Cases
 * Test senaryoları ve örnekler
 */

const {
  isHighQualityCampaign,
  filterHighQualityCampaigns,
} = require('./campaignQualityFilter');

// Test kampanyaları
const testCampaigns = {
  // ✅ Kaliteli kampanyalar
  highQuality: {
    netflix50: {
      title: '%50 İndirim',
      description: 'Netflix Abonelik İndirimi / Yapı Kredi',
      originalUrl: 'https://www.yapikredi.com.tr/kampanyalar/netflix',
    },
    trendyol200: {
      title: '200 TL Puan',
      description: 'Trendyol Alışveriş Puanı / Garanti BBVA',
      originalUrl: 'https://www.garantibbva.com.tr/kampanyalar/trendyol',
    },
    thy20: {
      title: '%20 İndirim',
      description: 'THY Uçuş İndirimi / Turkcell Platinum',
      originalUrl: 'https://www.turkcell.com.tr/kampanyalar/thy',
    },
  },

  // ❌ Düşük değerli kampanyalar
  lowQuality: {
    coffee: {
      title: '1 Kahve Hediye',
      description: 'Starbucks / Akbank',
      originalUrl: 'https://www.akbank.com/kampanyalar/starbucks',
    },
    pr: {
      title: 'Özel PR Kampanyası',
      description: 'Tanıtım kampanyası',
      originalUrl: 'https://www.akbank.com/kampanyalar/pr',
    },
    small: {
      title: '10 TL Puan',
      description: 'Küçük hediye',
      originalUrl: 'https://www.akbank.com/kampanyalar/small',
    },
  },
};

// Test çalıştırma (manuel)
console.log('=== Campaign Quality Filter Tests ===\n');

console.log('✅ High Quality Campaigns:');
Object.values(testCampaigns.highQuality).forEach((campaign, index) => {
  const result = isHighQualityCampaign(campaign);
  console.log(`${index + 1}. ${campaign.title}: ${result ? 'PASS' : 'FAIL'}`);
});

console.log('\n❌ Low Quality Campaigns (should be filtered):');
Object.values(testCampaigns.lowQuality).forEach((campaign, index) => {
  const result = isHighQualityCampaign(campaign);
  console.log(`${index + 1}. ${campaign.title}: ${result ? 'FAIL (should be false)' : 'PASS (correctly filtered)'}`);
});

console.log('\n=== Filter Test ===');
const allCampaigns = [
  ...Object.values(testCampaigns.highQuality),
  ...Object.values(testCampaigns.lowQuality),
];
const filtered = filterHighQualityCampaigns(allCampaigns);
console.log(`Total: ${allCampaigns.length}, Filtered: ${filtered.length}`);
console.log(`Removed: ${allCampaigns.length - filtered.length} low-quality campaigns`);
