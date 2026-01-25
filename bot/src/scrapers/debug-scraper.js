/**
 * Debug Scraper
 * Gerçek web sitelerini incelemek için debug tool
 */

const puppeteer = require('puppeteer');

async function debugAkbank() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

  try {
    console.log('🔍 Akbank sayfası yükleniyor...');
    await page.goto('https://www.akbank.com/tr-tr/kampanyalar', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });
    await page.waitForTimeout(3000);

    // Sayfa içeriğini al
    const content = await page.content();
    console.log('📄 Sayfa içeriği uzunluğu:', content.length);

    // Tüm linkleri bul
    const links = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('a[href*="kampanya"], a[href*="campaign"], a[href*="firsat"]'));
      return anchors.map(a => ({
        href: a.href,
        text: a.textContent.trim().substring(0, 100),
        classes: a.className,
      })).slice(0, 10);
    });
    console.log('🔗 Bulunan linkler:', JSON.stringify(links, null, 2));

    // Tüm başlıkları bul
    const headings = await page.evaluate(() => {
      const h2h3 = Array.from(document.querySelectorAll('h2, h3, h4, .title, [class*="title"], [class*="Title"]'));
      return h2h3.map(h => ({
        text: h.textContent.trim().substring(0, 100),
        tag: h.tagName,
        classes: h.className,
      })).slice(0, 10);
    });
    console.log('📝 Bulunan başlıklar:', JSON.stringify(headings, null, 2));

    // Kampanya benzeri elementleri bul
    const campaignLike = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('[class*="campaign"], [class*="kampanya"], [class*="firsat"], [class*="promo"], [class*="offer"]'));
      return elements.map(el => ({
        tag: el.tagName,
        classes: el.className,
        text: el.textContent.trim().substring(0, 100),
      })).slice(0, 10);
    });
    console.log('🎯 Kampanya benzeri elementler:', JSON.stringify(campaignLike, null, 2));

    // Screenshot al
    await page.screenshot({ path: '/tmp/akbank-debug.png', fullPage: true });
    console.log('📸 Screenshot kaydedildi: /tmp/akbank-debug.png');

  } catch (error) {
    console.error('❌ Hata:', error.message);
  } finally {
    await browser.close();
  }
}

async function debugTurkcell() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

  try {
    console.log('🔍 Turkcell sayfası yükleniyor...');
    await page.goto('https://www.turkcell.com.tr/kampanyalar', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });
    await page.waitForTimeout(3000);

    // Sayfa içeriğini al
    const content = await page.content();
    console.log('📄 Sayfa içeriği uzunluğu:', content.length);

    // Tüm linkleri bul
    const links = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('a[href*="kampanya"], a[href*="campaign"], a[href*="firsat"]'));
      return anchors.map(a => ({
        href: a.href,
        text: a.textContent.trim().substring(0, 100),
        classes: a.className,
      })).slice(0, 10);
    });
    console.log('🔗 Bulunan linkler:', JSON.stringify(links, null, 2));

    // Tüm başlıkları bul
    const headings = await page.evaluate(() => {
      const h2h3 = Array.from(document.querySelectorAll('h2, h3, h4, .title, [class*="title"], [class*="Title"]'));
      return h2h3.map(h => ({
        text: h.textContent.trim().substring(0, 100),
        tag: h.tagName,
        classes: h.className,
      })).slice(0, 10);
    });
    console.log('📝 Bulunan başlıklar:', JSON.stringify(headings, null, 2));

    // Kampanya benzeri elementleri bul
    const campaignLike = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('[class*="campaign"], [class*="kampanya"], [class*="firsat"], [class*="promo"], [class*="offer"]'));
      return elements.map(el => ({
        tag: el.tagName,
        classes: el.className,
        text: el.textContent.trim().substring(0, 100),
      })).slice(0, 10);
    });
    console.log('🎯 Kampanya benzeri elementler:', JSON.stringify(campaignLike, null, 2));

  } catch (error) {
    console.error('❌ Hata:', error.message);
  } finally {
    await browser.close();
  }
}

// Çalıştır
if (require.main === module) {
  const source = process.argv[2] || 'both';
  if (source === 'akbank' || source === 'both') {
    debugAkbank().then(() => {
      if (source === 'both') {
        return debugTurkcell();
      }
    }).catch(console.error);
  } else if (source === 'turkcell') {
    debugTurkcell().catch(console.error);
  }
}

module.exports = { debugAkbank, debugTurkcell };
