/**
 * FAZ 6: Eksik Source'ları Database'e Ekle
 * Mevcut scraper'lar için gerekli source'ları ekler
 */

const pool = require('../config/database');
const Source = require('../models/Source');

/**
 * Eksik source'ları database'e ekler
 */
async function addMissingSources() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log('🌱 Eksik source\'lar ekleniyor...');

    // Mevcut scraper'lar için gerekli source'lar
    const sources = [
      {
        name: 'İş Bankası',
        type: 'bank',
        logoUrl: null,
        websiteUrl: 'https://www.isbank.com.tr',
      },
      {
        name: 'Vodafone',
        type: 'operator',
        logoUrl: null,
        websiteUrl: 'https://www.vodafone.com.tr',
      },
      {
        name: 'Türk Telekom',
        type: 'operator',
        logoUrl: null,
        websiteUrl: 'https://www.turktelekom.com.tr',
      },
      // Yeni talep edilen bankalar
      { name: 'Şekerbank', type: 'bank', logoUrl: null, websiteUrl: 'https://www.sekerbank.com.tr' },
      { name: 'Fibabanka', type: 'bank', logoUrl: null, websiteUrl: 'https://www.fibabanka.com.tr' },
      { name: 'Anadolubank', type: 'bank', logoUrl: null, websiteUrl: 'https://www.anadolubank.com.tr' },
      { name: 'Alternatif Bank', type: 'bank', logoUrl: null, websiteUrl: 'https://www.abank.com.tr' },
      { name: 'OdeaBank', type: 'bank', logoUrl: null, websiteUrl: 'https://www.odeabank.com.tr' },
      { name: 'ICBC Turkey Bank', type: 'bank', logoUrl: null, websiteUrl: 'https://www.icbc.com.tr' },
      { name: 'Burgan Bank', type: 'bank', logoUrl: null, websiteUrl: 'https://www.burgan.com.tr' },
      { name: 'Turkish Bank', type: 'bank', logoUrl: null, websiteUrl: 'https://www.turkishbank.com' },
      { name: 'HSBC Türkiye', type: 'bank', logoUrl: null, websiteUrl: 'https://www.hsbc.com.tr' },
      { name: 'Hayat Finans', type: 'bank', logoUrl: null, websiteUrl: 'https://www.hayatfinans.com.tr' },
      { name: 'TOM Bank', type: 'bank', logoUrl: null, websiteUrl: 'https://www.tombank.com.tr' },
    ];

    // Mevcut source'ları kontrol et
    const existingSources = await Source.findAll();
    const existingNames = existingSources.map(s => s.name.toLowerCase().trim());

    for (const sourceData of sources) {
      const normalizedName = sourceData.name.toLowerCase().trim();
      
      // Eğer zaten varsa atla
      if (existingNames.includes(normalizedName)) {
        console.log(`⏭️  Source zaten mevcut: ${sourceData.name}`);
        continue;
      }

      // Yeni source oluştur
      try {
        const source = await Source.create(sourceData);
        console.log(`✅ Source oluşturuldu: ${source.name} (${source.id})`);
      } catch (error) {
        // UNIQUE constraint hatası olabilir (case-insensitive kontrol yapıyoruz ama DB'de case-sensitive olabilir)
        if (error.message.includes('duplicate') || error.message.includes('UNIQUE')) {
          console.log(`⚠️  Source zaten mevcut (duplicate): ${sourceData.name}`);
        } else {
          throw error;
        }
      }
    }

    await client.query('COMMIT');
    console.log('✅ Eksik source\'lar başarıyla eklendi');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Source ekleme hatası:', error);
    throw error;
  } finally {
    client.release();
    // pool.end() kaldırıldı - diğer işlemler için pool açık kalmalı
  }
}

// Run
if (require.main === module) {
  addMissingSources()
    .then(() => {
      console.log('Source ekleme tamamlandı');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Source ekleme başarısız:', error);
      process.exit(1);
    });
}

module.exports = { addMissingSources };
