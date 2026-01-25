/**
 * Halkbank Network Analyzer Script
 * FAZ 7.4: Halkbank kampanya sayfası için network analizi
 */

const NetworkAnalyzer = require('../scrapers/fetch/network-analyzer');

async function analyzeHalkbank() {
  const analyzer = new NetworkAnalyzer(
    'Halkbank',
    'https://www.halkbank.com.tr/kampanyalar'
  );

  try {
    console.log('🔍 Halkbank network analizi başlatılıyor...\n');
    const results = await analyzer.analyze(60000); // 60 saniye timeout
    
    analyzer.printResults(results);
    
    // Tüm request'leri göster (debug için)
    if (results.allRequests.length > 0) {
      console.log(`\n📋 Tüm XHR/Fetch Request'ler (ilk 10):`);
      results.allRequests.slice(0, 10).forEach((req, index) => {
        console.log(`${index + 1}. ${req.method} ${req.url}`);
      });
    }

    // En iyi endpoint önerisi
    if (results.jsonEndpoints.length > 0) {
      const bestEndpoint = results.jsonEndpoints[0];
      console.log(`\n✅ Önerilen Endpoint:`);
      console.log(`   URL: ${bestEndpoint.url}`);
      console.log(`   Method: ${bestEndpoint.method}`);
      console.log(`   Status: ${bestEndpoint.status}`);
    } else if (results.campaignEndpoints.length > 0) {
      const bestEndpoint = results.campaignEndpoints[0];
      console.log(`\n⚠️ JSON endpoint bulunamadı, ancak kampanya ile ilgili endpoint'ler var:`);
      console.log(`   URL: ${bestEndpoint.url}`);
      console.log(`   Method: ${bestEndpoint.method}`);
    } else {
      console.log(`\n❌ Kampanya ile ilgili endpoint bulunamadı.`);
      console.log(`   Toplam ${results.summary.totalRequests} request yakalandı.`);
    }

    return results;
  } catch (error) {
    console.error('❌ Analiz hatası:', error.message);
    throw error;
  }
}

// Run analysis
if (require.main === module) {
  analyzeHalkbank()
    .then(() => {
      console.log('\n✅ Analiz tamamlandı');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Analiz başarısız:', error);
      process.exit(1);
    });
}

module.exports = analyzeHalkbank;
