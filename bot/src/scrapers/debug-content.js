/**
 * Content Debug - Sayfa içeriğini detaylı incele
 */

const puppeteer = require('puppeteer');

async function debugAkbankContent() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

  try {
    await page.goto('https://www.akbank.com/kampanyalar', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });
    await page.waitForTimeout(5000);

    // Ana içerik alanını bul
    const mainContent = await page.evaluate(() => {
      const main = document.querySelector('main, [role="main"], .main-content, .content, #content');
      if (!main) return null;
      
      // Tüm linkleri bul
      const links = Array.from(main.querySelectorAll('a[href*="/kampanyalar/"]'));
      return links.map(a => ({
        href: a.href,
        text: a.textContent.trim(),
        classes: a.className,
        parent: a.parentElement?.tagName,
        parentClasses: a.parentElement?.className,
      }));
    });
    console.log('🔗 Ana içerik linkleri:', JSON.stringify(mainContent, null, 2));

    // Tüm div'leri kontrol et (kampanya kartları olabilir)
    const divs = await page.evaluate(() => {
      const allDivs = Array.from(document.querySelectorAll('div[class*="campaign"], div[class*="kampanya"], div[class*="card"], div[class*="item"]'));
      return allDivs.map(div => ({
        classes: div.className,
        text: div.textContent.trim().substring(0, 200),
        hasLink: !!div.querySelector('a[href]'),
        link: div.querySelector('a[href]')?.href,
      })).slice(0, 10);
    });
    console.log('📦 Div elementleri:', JSON.stringify(divs, null, 2));

    // Sayfa HTML'inin bir kısmını al
    const htmlSnippet = await page.evaluate(() => {
      const main = document.querySelector('main, [role="main"], .main-content') || document.body;
      return main.innerHTML.substring(0, 5000);
    });
    console.log('📄 HTML snippet (ilk 5000 karakter):', htmlSnippet.substring(0, 1000));

  } catch (error) {
    console.error('❌ Hata:', error.message);
  } finally {
    await browser.close();
  }
}

async function debugTurkcellContent() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

  try {
    await page.goto('https://www.turkcell.com.tr/kampanyalar', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });
    await page.waitForTimeout(5000);

    // Ana içerik alanını bul
    const mainContent = await page.evaluate(() => {
      const main = document.querySelector('main, [role="main"], .main-content, .content');
      if (!main) return null;
      
      const links = Array.from(main.querySelectorAll('a[href*="/kampanyalar/"]'));
      return links.map(a => ({
        href: a.href,
        text: a.textContent.trim(),
        classes: a.className,
        parent: a.parentElement?.tagName,
        parentClasses: a.parentElement?.className,
      }));
    });
    console.log('🔗 Ana içerik linkleri:', JSON.stringify(mainContent, null, 2));

    // Tüm div'leri kontrol et
    const divs = await page.evaluate(() => {
      const allDivs = Array.from(document.querySelectorAll('div[class*="campaign"], div[class*="kampanya"], div[class*="card"], div[class*="promo"]'));
      return allDivs.map(div => ({
        classes: div.className,
        text: div.textContent.trim().substring(0, 200),
        hasLink: !!div.querySelector('a[href]'),
        link: div.querySelector('a[href]')?.href,
      })).slice(0, 10);
    });
    console.log('📦 Div elementleri:', JSON.stringify(divs, null, 2));

  } catch (error) {
    console.error('❌ Hata:', error.message);
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  const source = process.argv[2] || 'both';
  if (source === 'akbank' || source === 'both') {
    debugAkbankContent().then(() => {
      if (source === 'both') {
        return debugTurkcellContent();
      }
    }).catch(console.error);
  } else if (source === 'turkcell') {
    debugTurkcellContent().catch(console.error);
  }
}

module.exports = { debugAkbankContent, debugTurkcellContent };
