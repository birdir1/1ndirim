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
      { name: 'Zara', type: 'operator', logoUrl: null, websiteUrl: 'https://www.zara.com/tr/en/woman-special-prices-l1314.html' },
      { name: 'H&M', type: 'operator', logoUrl: null, websiteUrl: 'https://www2.hm.com/tr_tr/ladies/deals/deal.html' },
      { name: 'Bershka', type: 'operator', logoUrl: null, websiteUrl: 'https://www.bershka.com/tr/erkek/sale/bershka-c1010747948.html' },
      { name: 'Pull&Bear', type: 'operator', logoUrl: null, websiteUrl: 'https://www.pullandbear.com/tr/kadin/kampanyalar-n6492' },
      { name: 'LCW', type: 'operator', logoUrl: null, websiteUrl: 'https://www.lcw.com/kampanyalar' },
      { name: 'Koton', type: 'operator', logoUrl: null, websiteUrl: 'https://www.koton.com/kampanyalarimiz' },
      { name: 'Mavi', type: 'operator', logoUrl: null, websiteUrl: 'https://www.mavi.com/' },
      { name: 'DeFacto', type: 'operator', logoUrl: null, websiteUrl: 'https://www.defacto.com.tr/statik/kampanyalar' },
      { name: 'Collins', type: 'operator', logoUrl: null, websiteUrl: 'https://www.collins.com.tr/' },
      { name: 'Beymen', type: 'operator', logoUrl: null, websiteUrl: 'https://www.beymen.com/tr/sale-kampanyalar-beymen-ozel-markalarda-indirim--101090' },
      // Kozmetik (Top 5)
      { name: 'Sephora', type: 'operator', logoUrl: null, websiteUrl: 'https://www.sephora.com.tr/buyuk-indirim/' },
      { name: 'Gratis', type: 'operator', logoUrl: null, websiteUrl: 'https://www.gratis.com/kampanyalar' },
      { name: 'Watsons', type: 'operator', logoUrl: null, websiteUrl: 'https://www.watsons.com.tr/kampanyalar' },
      { name: 'MAC Cosmetics', type: 'operator', logoUrl: null, websiteUrl: 'https://www.maccosmetics.com.tr/' },
      { name: 'Flormar', type: 'operator', logoUrl: null, websiteUrl: 'https://www.flormar.com.tr/kampanyalar/' },
      // Seyahat
      { name: 'Pegasus', type: 'operator', logoUrl: null, websiteUrl: 'https://www.flypgs.com/kampanyalar' },
      { name: 'Türk Hava Yolları', type: 'operator', logoUrl: null, websiteUrl: 'https://www.turkishairlines.com/tr-tr/kampanyalar/' },
      { name: 'AJet', type: 'operator', logoUrl: null, websiteUrl: 'https://www.ajet.com.tr/' },
      { name: 'Setur', type: 'operator', logoUrl: null, websiteUrl: 'https://www.setur.com.tr/kampanyalar' },
      { name: 'ETS', type: 'operator', logoUrl: null, websiteUrl: 'https://www.etstur.com/kampanyalar' },
      { name: 'Odamax', type: 'operator', logoUrl: null, websiteUrl: 'https://www.odamax.com/kampanyalar' },
      // Eğlence / Bilet
      { name: 'Passo', type: 'operator', logoUrl: null, websiteUrl: 'https://www.passo.com.tr/tr/kampanyalar' },
      { name: 'Müzekart', type: 'operator', logoUrl: null, websiteUrl: 'https://www.muze.gov.tr/muzekart' },
      { name: 'Biletix', type: 'operator', logoUrl: null, websiteUrl: 'https://www.biletix.com/anasayfa/kampanyalar-tr' },
      // Entertainment (OTT / Music / Gaming)
      { name: 'Netflix', type: 'operator', logoUrl: null, websiteUrl: 'https://www.vodafonepay.com.tr/kampanyalar/netflix-ve-spotify-uyelikleriniz-1-ay-bedava' },
      { name: 'Gain', type: 'operator', logoUrl: null, websiteUrl: 'https://www.vodafonepay.com.tr/kampanyalar/netflix-ve-spotify-uyelikleriniz-1-ay-bedava' },
      { name: 'Spotify', type: 'operator', logoUrl: null, websiteUrl: 'https://www.spotify.com/tr/student/' },
      { name: 'Disney+', type: 'operator', logoUrl: null, websiteUrl: 'https://www.disneyplus.com/tr-tr' },
      { name: 'Amazon Prime', type: 'operator', logoUrl: null, websiteUrl: 'https://www.mastercard.com.tr/tr-tr/consumer/offers-promotions/amazon-prime-uyeligini-3-ay-ucretsiz-deneyin.html' },
      { name: 'BluTV', type: 'operator', logoUrl: null, websiteUrl: 'https://www.blutv.com/yardim-kampanya/' },
      { name: 'Steam', type: 'operator', logoUrl: null, websiteUrl: 'https://store.steampowered.com/specials' },
      { name: 'Epic Games', type: 'operator', logoUrl: null, websiteUrl: 'https://store.epicgames.com/tr/free-games' },
      { name: 'Nvidia', type: 'operator', logoUrl: null, websiteUrl: 'https://www.nvidia.com/en-us/geforce-now/' },
      // Türk Telekom Prime (separate source name used by bot)
      { name: 'Türk Telekom Prime', type: 'operator', logoUrl: null, websiteUrl: 'https://bireysel.turktelekom.com.tr/prime' },
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
        const shouldUpdateType = false;
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
