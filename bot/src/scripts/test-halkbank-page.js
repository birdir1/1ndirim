/**
 * Halkbank Sayfa Test Script
 * Sayfa yüklenip yüklenmediğini test eder
 */

const puppeteer = require('puppeteer');

async function testHalkbankPage() {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
    ],
  });

  const page = await browser.newPage();
  
  const requests = [];
  page.on('request', (request) => {
    requests.push({
      url: request.url(),
      method: request.method(),
      resourceType: request.resourceType(),
    });
  });

  try {
    console.log('🌐 Sayfa yükleniyor...');
    await page.goto('https://www.halkbank.com.tr/kampanyalar', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });

    const title = await page.title();
    const url = page.url();
    console.log(`\n✅ Sayfa yüklendi:`);
    console.log(`   Title: ${title}`);
    console.log(`   URL: ${url}`);
    console.log(`   Toplam request: ${requests.length}`);
    
    const xhrRequests = requests.filter(r => r.resourceType === 'xhr' || r.resourceType === 'fetch');
    console.log(`   XHR/Fetch request: ${xhrRequests.length}`);
    
    if (xhrRequests.length > 0) {
      console.log(`\n📡 XHR/Fetch Request'ler:`);
      xhrRequests.slice(0, 10).forEach((req, i) => {
        console.log(`   ${i + 1}. ${req.method} ${req.url}`);
      });
    }
    
    // Sayfa içeriğini kontrol et
    const content = await page.content();
    console.log(`\n📄 Sayfa içeriği uzunluğu: ${content.length} karakter`);
    
    // Kampanya kelimesi var mı?
    const hasCampaign = content.toLowerCase().includes('kampanya') || content.toLowerCase().includes('campaign');
    console.log(`   Kampanya içeriği var mı: ${hasCampaign ? 'EVET' : 'HAYIR'}`);
    
  } catch (error) {
    console.error(`❌ Hata: ${error.message}`);
  } finally {
    await browser.close();
  }
}

testHalkbankPage()
  .then(() => {
    console.log('\n✅ Test tamamlandı');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test başarısız:', error);
    process.exit(1);
  });
