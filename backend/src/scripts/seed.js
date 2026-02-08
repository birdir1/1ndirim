const pool = require('../config/database');
const Campaign = require('../models/Campaign');
const Source = require('../models/Source');

/**
 * Seed data script
 * Manuel test verileri oluşturur
 */
async function seed() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log('🌱 Seed data oluşturuluyor...');

    // 1. Sources oluştur
    const sources = [
      {
        name: 'Yapı Kredi',
        type: 'bank',
        logoUrl: null,
        websiteUrl: 'https://www.yapikredi.com.tr',
      },
      {
        name: 'Akbank',
        type: 'bank',
        logoUrl: null,
        websiteUrl: 'https://www.akbank.com',
      },
      {
        name: 'Garanti BBVA',
        type: 'bank',
        logoUrl: null,
        websiteUrl: 'https://www.garantibbva.com.tr',
      },
      {
        name: 'Turkcell',
        type: 'operator',
        logoUrl: null,
        websiteUrl: 'https://www.turkcell.com.tr',
      },
      {
        name: 'Tosla',
        type: 'bank',
        logoUrl: null,
        websiteUrl: 'https://www.tosla.com',
      },
    ];

    const createdSources = [];
    for (const sourceData of sources) {
      const source = await Source.create(sourceData);
      createdSources.push(source);
      console.log(`✅ Source oluşturuldu: ${source.name} (${source.id})`);
    }

    // 2. Campaigns oluştur
    // NOT: Sadece gerçek değerli kampanyalar ekleniyor
    // Düşük değerli, PR kampanyaları, "kahve hediye" gibi kampanyalar eklenmiyor
    const campaigns = [
      {
        sourceId: createdSources.find((s) => s.name === 'Yapı Kredi').id,
        title: '%50 İndirim',
        description: 'Netflix Abonelik İndirimi / Yapı Kredi',
        detailText: 'Yapı Kredi Worldcard ile Netflix aboneliğinde %50 indirim.\nMinimum 6 aylık abonelik gereklidir.\nKampanya 30 Kasım\'a kadar geçerlidir.\nOnline platformlarda geçerlidir.',
        iconName: 'play_arrow',
        iconColor: '#DC2626',
        iconBgColor: '#FEE2E2',
        tags: ['Online', 'Son 2 gün', 'Yüksek Değer'],
        originalUrl: 'https://www.yapikredi.com.tr/kampanyalar/netflix',
        expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 gün sonra
        howToUse: [
          { step: 1, text: 'Yapı Kredi Worldcard ile Netflix\'e giriş yapın' },
          { step: 2, text: 'Abonelik sayfasında kampanya kodunu girin' },
          { step: 3, text: 'İndirim otomatik uygulanacaktır' },
        ],
        validityChannels: ['Online'],
        status: 'active',
      },
      {
        sourceId: createdSources.find((s) => s.name === 'Garanti BBVA').id,
        title: '200 TL Puan',
        description: 'Trendyol Alışveriş Puanı / Garanti BBVA',
        detailText: 'Garanti BBVA Bonus kartı ile Trendyol\'da 500 TL ve üzeri alışverişte 200 TL puan kazanın.\nPuanlar hesabınıza otomatik yüklenir.\nKampanya süresiz geçerlidir.\nOnline platformlarda geçerlidir.',
        iconName: 'shopping_bag',
        iconColor: '#3B82F6',
        iconBgColor: '#DBEAFE',
        tags: ['Online', 'Yüksek Değer'],
        originalUrl: 'https://www.garantibbva.com.tr/kampanyalar/trendyol',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 gün sonra
        howToUse: [
          { step: 1, text: 'Trendyol\'da 500 TL ve üzeri alışveriş yapın' },
          { step: 2, text: 'Garanti BBVA Bonus kartınızla ödeme yapın' },
          { step: 3, text: '200 TL puan hesabınıza otomatik yüklenecektir' },
        ],
        validityChannels: ['Online'],
        status: 'active',
      },
      {
        sourceId: createdSources.find((s) => s.name === 'Turkcell').id,
        title: '%20 İndirim',
        description: 'THY Uçuş İndirimi / Turkcell Platinum',
        detailText: 'Turkcell Platinum üyeleri THY yurt dışı uçuşlarında %20 indirim kazanın.\nMinimum 500 TL bilet fiyatı gereklidir.\nKampanya 1 hafta daha geçerlidir.\nYurt dışı uçuşlarda geçerlidir.',
        iconName: 'flight',
        iconColor: '#DC2626',
        iconBgColor: '#FEE2E2',
        tags: ['Yurt Dışı', 'Son 1 hafta', 'Yüksek Değer'],
        originalUrl: 'https://www.turkcell.com.tr/kampanyalar/thy',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 gün sonra
        howToUse: [
          { step: 1, text: 'THY web sitesinde yurt dışı uçuş arayın' },
          { step: 2, text: 'Turkcell Platinum üyeliğinizi doğrulayın' },
          { step: 3, text: 'İndirim otomatik uygulanacaktır' },
        ],
        validityChannels: ['Online', 'Yurt Dışı'],
        status: 'active',
      },
    ];

    for (const campaignData of campaigns) {
      const campaign = await Campaign.create(campaignData);
      console.log(`✅ Campaign oluşturuldu: ${campaign.title} (${campaign.id})`);
    }

    await client.query('COMMIT');
    console.log('✅ Seed data başarıyla oluşturuldu');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Seed hatası:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run seed
seed()
  .then(() => {
    console.log('Seed tamamlandı');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed başarısız:', error);
    process.exit(1);
  });
