/**
 * Tüm bot scraper'ları için kaynakları veritabanına ekler
 * Bot'taki tüm scraper'lar için source oluşturur
 */

require('dotenv').config();
const pool = require('../config/database');
const Source = require('../models/Source');

// Bot'taki tüm scraper'lar ve kaynak bilgileri
const sources = [
  { name: 'Akbank', type: 'bank', websiteUrl: 'https://www.akbank.com' },
  { name: 'Turkcell', type: 'operator', websiteUrl: 'https://www.turkcell.com.tr' },
  { name: 'Garanti BBVA', type: 'bank', websiteUrl: 'https://www.garantibbva.com.tr' },
  { name: 'Yapı Kredi', type: 'bank', websiteUrl: 'https://www.yapikredi.com.tr' },
  { name: 'İş Bankası', type: 'bank', websiteUrl: 'https://www.isbank.com.tr' },
  { name: 'Vodafone', type: 'operator', websiteUrl: 'https://www.vodafone.com.tr' },
  { name: 'Türk Telekom', type: 'operator', websiteUrl: 'https://www.turktelekom.com.tr' },
  { name: 'Ziraat Bankası', type: 'bank', websiteUrl: 'https://www.ziraatbank.com.tr' },
  { name: 'Halkbank', type: 'bank', websiteUrl: 'https://www.halkbank.com.tr' },
  { name: 'VakıfBank', type: 'bank', websiteUrl: 'https://www.vakifbank.com.tr' },
  { name: 'DenizBank', type: 'bank', websiteUrl: 'https://www.denizbank.com' },
  { name: 'QNB Finansbank', type: 'bank', websiteUrl: 'https://www.qnbfinansbank.com' },
  { name: 'TEB', type: 'bank', websiteUrl: 'https://www.teb.com.tr' },
  { name: 'ING Bank', type: 'bank', websiteUrl: 'https://www.ingbank.com.tr' },
  { name: 'Kuveyt Türk', type: 'bank', websiteUrl: 'https://www.kuveytturk.com.tr' },
  { name: 'Albaraka Türk', type: 'bank', websiteUrl: 'https://www.albaraka.com.tr' },
  { name: 'Türkiye Finans', type: 'bank', websiteUrl: 'https://www.turkiyefinans.com.tr' },
  { name: 'Vakıf Katılım', type: 'bank', websiteUrl: 'https://www.vakifkatilim.com.tr' },
  { name: 'Ziraat Katılım', type: 'bank', websiteUrl: 'https://www.ziraatkatilim.com.tr' },
  { name: 'Emlak Katılım', type: 'bank', websiteUrl: 'https://www.emlakkatilim.com.tr' },
  { name: 'Enpara', type: 'bank', websiteUrl: 'https://www.enpara.com' },
  { name: 'CEPTETEB', type: 'bank', websiteUrl: 'https://www.cepteteb.com' },
  { name: 'N Kolay', type: 'bank', websiteUrl: 'https://www.nkolay.com' },
  { name: 'PTTcell', type: 'operator', websiteUrl: 'https://www.pttcell.com.tr' },
  { name: 'Türk Telekom Prime', type: 'operator', websiteUrl: 'https://bireysel.turktelekom.com.tr/prime' },
  // Fashion (Top 10)
  { name: 'Zara', type: 'operator', websiteUrl: 'https://www.zara.com/tr/en/woman-special-prices-l1314.html' },
  { name: 'H&M', type: 'operator', websiteUrl: 'https://www2.hm.com/tr_tr/ladies/deals/deal.html' },
  { name: 'Bershka', type: 'operator', websiteUrl: 'https://www.bershka.com/tr/erkek/sale/bershka-c1010747948.html' },
  { name: 'Pull&Bear', type: 'operator', websiteUrl: 'https://www.pullandbear.com/tr/kadin/kampanyalar-n6492' },
  { name: 'LCW', type: 'operator', websiteUrl: 'https://www.lcw.com/kampanyalar' },
  { name: 'Koton', type: 'operator', websiteUrl: 'https://www.koton.com/kampanyalarimiz' },
  { name: 'Mavi', type: 'operator', websiteUrl: 'https://www.mavi.com/' },
  { name: 'DeFacto', type: 'operator', websiteUrl: 'https://www.defacto.com.tr/statik/kampanyalar' },
  { name: 'Collins', type: 'operator', websiteUrl: 'https://www.collins.com.tr/' },
  { name: 'Beymen', type: 'operator', websiteUrl: 'https://www.beymen.com/tr/sale-kampanyalar-beymen-ozel-markalarda-indirim--101090' },
  // Cosmetics (Top 5)
  { name: 'Sephora', type: 'operator', websiteUrl: 'https://www.sephora.com.tr/buyuk-indirim/' },
  { name: 'Gratis', type: 'operator', websiteUrl: 'https://www.gratis.com/kampanyalar' },
  { name: 'Watsons', type: 'operator', websiteUrl: 'https://www.watsons.com.tr/kampanyalar' },
  { name: 'MAC Cosmetics', type: 'operator', websiteUrl: 'https://www.maccosmetics.com.tr/' },
  { name: 'Flormar', type: 'operator', websiteUrl: 'https://www.flormar.com.tr/kampanyalar/' },
  // Travel
  { name: 'Pegasus', type: 'operator', websiteUrl: 'https://www.flypgs.com/kampanyalar' },
  { name: 'Türk Hava Yolları', type: 'operator', websiteUrl: 'https://www.turkishairlines.com/tr-tr/kampanyalar/' },
  { name: 'AJet', type: 'operator', websiteUrl: 'https://www.ajet.com.tr/' },
  { name: 'Setur', type: 'operator', websiteUrl: 'https://www.setur.com.tr/kampanyalar' },
  { name: 'ETS', type: 'operator', websiteUrl: 'https://www.etstur.com/kampanyalar' },
  { name: 'Odamax', type: 'operator', websiteUrl: 'https://www.odamax.com/kampanyalar' },
  // Entertainment / Ticketing
  { name: 'Passo', type: 'operator', websiteUrl: 'https://www.passo.com.tr/tr/kampanyalar' },
  { name: 'Müzekart', type: 'operator', websiteUrl: 'https://www.muze.gov.tr/muzekart' },
  { name: 'Biletix', type: 'operator', websiteUrl: 'https://www.biletix.com/anasayfa/kampanyalar-tr' },
  // Entertainment (OTT / Music / Gaming)
  { name: 'Netflix', type: 'operator', websiteUrl: 'https://www.vodafonepay.com.tr/kampanyalar/netflix-ve-spotify-uyelikleriniz-1-ay-bedava' },
  { name: 'Gain', type: 'operator', websiteUrl: 'https://www.vodafonepay.com.tr/kampanyalar/netflix-ve-spotify-uyelikleriniz-1-ay-bedava' },
  { name: 'Spotify', type: 'operator', websiteUrl: 'https://www.spotify.com/tr/student/' },
  { name: 'Disney+', type: 'operator', websiteUrl: 'https://www.disneyplus.com/tr-tr' },
  { name: 'Amazon Prime', type: 'operator', websiteUrl: 'https://www.mastercard.com.tr/tr-tr/consumer/offers-promotions/amazon-prime-uyeligini-3-ay-ucretsiz-deneyin.html' },
  { name: 'BluTV', type: 'operator', websiteUrl: 'https://www.blutv.com/yardim-kampanya/' },
  { name: 'Steam', type: 'operator', websiteUrl: 'https://store.steampowered.com/specials' },
  { name: 'Epic Games', type: 'operator', websiteUrl: 'https://store.epicgames.com/tr/free-games' },
  { name: 'Nvidia', type: 'operator', websiteUrl: 'https://www.nvidia.com/en-us/geforce-now/' },
];

async function addAllSources() {
  try {
    // Veritabanı bağlantısını test et
    await pool.query('SELECT 1');
    console.log('✅ Veritabanı bağlantısı başarılı\n');

    // Mevcut kaynakları al
    const existingSources = await Source.findAll();
    const existingNames = existingSources.map(s => s.name.toLowerCase().trim());
    
    console.log(`📊 Mevcut kaynak sayısı: ${existingSources.length}\n`);

    let added = 0;
    let skipped = 0;

    for (const sourceData of sources) {
      const normalizedName = sourceData.name.toLowerCase().trim();
      
      // Eğer zaten varsa atla
      if (existingNames.includes(normalizedName)) {
        console.log(`⏭️  Kaynak zaten mevcut: ${sourceData.name}`);
        skipped++;
        continue;
      }

      // Yeni kaynak oluştur
      try {
        const source = await Source.create({
          name: sourceData.name,
          type: sourceData.type,
          logoUrl: null,
          websiteUrl: sourceData.websiteUrl,
          isActive: true,
        });
        console.log(`✅ Kaynak eklendi: ${source.name} (${source.type})`);
        added++;
      } catch (error) {
        if (error.message.includes('duplicate') || error.message.includes('UNIQUE')) {
          console.log(`⚠️  Kaynak zaten mevcut (duplicate): ${sourceData.name}`);
          skipped++;
        } else {
          console.error(`❌ Hata (${sourceData.name}):`, error.message);
          throw error;
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✅ Toplam ${added} kaynak eklendi`);
    console.log(`⏭️  ${skipped} kaynak zaten mevcuttu`);
    console.log(`📊 Toplam kaynak sayısı: ${existingSources.length + added}`);
    console.log('='.repeat(60) + '\n');

    await pool.end();
  } catch (error) {
    console.error('❌ Hata:', error.message);
    if (error.code === '42P01') {
      console.error('\n⚠️ sources tablosu bulunamadı!');
      console.error('   Önce migration\'ları çalıştırın:');
      console.error('   node src/scripts/run-all-migrations.js\n');
    }
    process.exit(1);
  }
}

addAllSources();
