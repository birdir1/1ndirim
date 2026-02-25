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
      { name: 'HSBC Türkiye', type: 'bank', logoUrl: null, websiteUrl: 'https://www.hsbc.com.tr' },
      { name: 'Hayat Finans', type: 'bank', logoUrl: null, websiteUrl: 'https://www.hayatfinans.com.tr' },
      { name: 'TOM Bank', type: 'bank', logoUrl: null, websiteUrl: 'https://www.tombank.com.tr' },
      // Giyim (Top 10)
      { name: 'Zara', type: 'fashion', logoUrl: null, websiteUrl: 'https://www.zara.com/tr/' },
      { name: 'H&M', type: 'fashion', logoUrl: null, websiteUrl: 'https://www2.hm.com/tr_tr/index.html' },
      { name: 'Bershka', type: 'fashion', logoUrl: null, websiteUrl: 'https://www.bershka.com/tr/' },
      { name: 'Pull&Bear', type: 'fashion', logoUrl: null, websiteUrl: 'https://www.pullandbear.com/tr/' },
      { name: 'LCW', type: 'fashion', logoUrl: null, websiteUrl: 'https://www.lcwaikiki.com/tr-TR/TR' },
      { name: 'Koton', type: 'fashion', logoUrl: null, websiteUrl: 'https://www.koton.com/tr/' },
      { name: 'Mavi', type: 'fashion', logoUrl: null, websiteUrl: 'https://www.mavi.com/' },
      { name: 'DeFacto', type: 'fashion', logoUrl: null, websiteUrl: 'https://www.defacto.com.tr/' },
      { name: 'Collins', type: 'fashion', logoUrl: null, websiteUrl: 'https://www.collins.com.tr/' },
      { name: 'Beymen', type: 'fashion', logoUrl: null, websiteUrl: 'https://www.beymen.com/tr' },
      // Kozmetik (Top 5)
      { name: 'Sephora', type: 'cosmetics', logoUrl: null, websiteUrl: 'https://www.sephora.com.tr/' },
      { name: 'Gratis', type: 'cosmetics', logoUrl: null, websiteUrl: 'https://www.gratis.com/' },
      { name: 'Watsons', type: 'cosmetics', logoUrl: null, websiteUrl: 'https://www.watsons.com.tr/' },
      { name: 'MAC Cosmetics', type: 'cosmetics', logoUrl: null, websiteUrl: 'https://www.maccosmetics.com.tr/' },
      { name: 'Flormar', type: 'cosmetics', logoUrl: null, websiteUrl: 'https://www.flormar.com.tr/' },
      // Seyahat
      { name: 'Pegasus', type: 'travel', logoUrl: null, websiteUrl: 'https://www.flypgs.com/kampanyalar' },
      { name: 'Setur', type: 'travel', logoUrl: null, websiteUrl: 'https://www.setur.com.tr/kampanyalar' },
      { name: 'ETS', type: 'travel', logoUrl: null, websiteUrl: 'https://www.etstur.com/kampanyalar' },
      { name: 'Odamax', type: 'travel', logoUrl: null, websiteUrl: 'https://www.odamax.com/kampanyalar' },
      // Eğlence / Bilet
      { name: 'Passo', type: 'entertainment', logoUrl: null, websiteUrl: 'https://www.passo.com.tr/kampanyalar' },
      { name: 'Müzekart', type: 'entertainment', logoUrl: null, websiteUrl: 'https://www.muze.gov.tr/muzekart' },
      { name: 'Biletix', type: 'entertainment', logoUrl: null, websiteUrl: 'https://www.biletix.com/kampanyalar' },
    ];

    // Mevcut source'ları kontrol et
    const existingSources = await Source.findAll();
    const existingByName = new Map(
      existingSources.map(s => [s.name.toLowerCase().trim(), s])
    );

    for (const sourceData of sources) {
      const normalizedName = sourceData.name.toLowerCase().trim();
      
      // Eğer zaten varsa atla
      if (existingByName.has(normalizedName)) {
        const existing = existingByName.get(normalizedName);
        const shouldUpdateType = existing && existing.type !== sourceData.type;
        const shouldUpdateWebsite =
          sourceData.websiteUrl &&
          existing &&
          sourceData.websiteUrl !== existing.website_url;

        if (shouldUpdateType || shouldUpdateWebsite) {
          await client.query(
            `UPDATE sources
             SET type = $1,
                 website_url = COALESCE($2, website_url),
                 updated_at = NOW()
             WHERE id = $3`,
            [sourceData.type, sourceData.websiteUrl || null, existing.id]
          );
          console.log(`🔁 Source güncellendi: ${sourceData.name} (${sourceData.type})`);
        } else {
          console.log(`⏭️  Source zaten mevcut: ${sourceData.name}`);
        }
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
