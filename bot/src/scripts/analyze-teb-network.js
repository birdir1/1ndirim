/**
 * TEB Network Analyzer Script
 * FAZ 7.1: TEB'in API endpoint'ini keşfetmek için network analizi yapar
 * 
 * Kullanım:
 * node src/scripts/analyze-teb-network.js
 */

const NetworkAnalyzer = require('../scrapers/fetch/network-analyzer');

async function analyzeTEB() {
  console.log('🔍 TEB Network Analizi Başlatılıyor...\n');

  const analyzer = new NetworkAnalyzer(
    'TEB',
    'https://www.teb.com.tr/sizin-icin/kampanyalar'
  );

  try {
    const results = await analyzer.analyze();
    analyzer.printResults(results);

    // JSON endpoint'leri dosyaya kaydet
    if (results.jsonEndpoints.length > 0) {
      console.log('\n📝 JSON Endpoint Detayları:');
      results.jsonEndpoints.forEach((req, index) => {
        console.log(`\n${index + 1}. Endpoint: ${req.url}`);
        console.log(`   Method: ${req.method}`);
        console.log(`   Status: ${req.status}`);
        console.log(`   Response Keys:`, Object.keys(req.responseData || {}).slice(0, 10));
      });
    }

    // En umut verici endpoint'i öner
    if (results.jsonEndpoints.length > 0) {
      const bestEndpoint = results.jsonEndpoints[0];
      console.log(`\n✅ Önerilen Endpoint: ${bestEndpoint.url}`);
      console.log(`   Bu endpoint teb-fetch-scraper.js dosyasına eklenebilir.`);
    } else {
      console.log('\n⚠️ JSON endpoint bulunamadı. Alternatif stratejiler:');
      console.log('   1. Sayfa içi JavaScript state analizi');
      console.log('   2. GraphQL endpoint kontrolü');
      console.log('   3. WebSocket connection kontrolü');
    }

    return results;
  } catch (error) {
    console.error('❌ Analiz hatası:', error.message);
    process.exit(1);
  }
}

// Script çalıştırılırsa
if (require.main === module) {
  analyzeTEB()
    .then(() => {
      console.log('\n✅ Analiz tamamlandı');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Hata:', error);
      process.exit(1);
    });
}

module.exports = { analyzeTEB };
