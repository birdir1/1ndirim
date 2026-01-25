/**
 * Detailed Debug Scraper
 * Gerçek web sitelerini detaylı incelemek için
 */

const puppeteer = require('puppeteer');

async function debugAkbankDetailed() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

  try {
    console.log('🔍 Akbank kampanyalar sayfası yükleniyor...');
    await page.goto('https://www.akbank.com/kampanyalar', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });
    await page.waitForTimeout(5000);

    // Sayfa başlığını kontrol et
    const title = await page.title();
    console.log('📄 Sayfa başlığı:', title);

    // Tüm article, section, div elementlerini kontrol et
    const articles = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('article, section, [class*="campaign"], [class*="kampanya"], [class*="card"], [class*="item"]'));
      return elements.map(el => ({
        tag: el.tagName,
        classes: el.className,
        text: el.textContent.trim().substring(0, 150),
        hasLink: !!el.querySelector('a[href]'),
        link: el.querySelector('a[href]')?.href,
      })).slice(0, 15);
    });
    console.log('📰 Article/Section elementleri:', JSON.stringify(articles, null, 2));

    // H2, H3 başlıklarını bul
    const headings = await page.evaluate(() => {
      const h2h3 = Array.from(document.querySelectorAll('h2, h3'));
      return h2h3.map(h => ({
        text: h.textContent.trim().substring(0, 100),
        tag: h.tagName,
        classes: h.className,
        parentClasses: h.parentElement?.className,
      })).slice(0, 20);
    });
    console.log('📝 H2/H3 başlıklar:', JSON.stringify(headings, null, 2));

    // Tüm linkleri bul (kampanya içeren)
    const allLinks = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('a[href*="kampanya"], a[href*="campaign"]'));
      return anchors.map(a => ({
        href: a.href,
        text: a.textContent.trim().substring(0, 100),
        classes: a.className,
        parentTag: a.parentElement?.tagName,
        parentClasses: a.parentElement?.className,
      })).slice(0, 20);
    });
    console.log('🔗 Kampanya linkleri:', JSON.stringify(allLinks, null, 2));

    // Text-based parsing: "kampanya", "indirim", "%" içeren elementler
    const textBased = await page.evaluate(() => {
      const allElements = Array.from(document.querySelectorAll('*'));
      return allElements
        .filter(el => {
          const text = el.textContent.toLowerCase();
          return (text.includes('kampanya') || text.includes('indirim') || text.includes('%') || text.match(/\d+\s*tl/i)) &&
                 text.length > 20 && text.length < 500;
        })
        .map(el => ({
          tag: el.tagName,
          classes: el.className,
          text: el.textContent.trim().substring(0, 200),
          hasLink: !!el.querySelector('a[href]'),
        }))
        .slice(0, 10);
    });
    console.log('📋 Text-based elementler:', JSON.stringify(textBased, null, 2));

  } catch (error) {
    console.error('❌ Hata:', error.message);
  } finally {
    await browser.close();
  }
}

async function debugTurkcellDetailed() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

  try {
    console.log('🔍 Turkcell kampanyalar sayfası yükleniyor...');
    await page.goto('https://www.turkcell.com.tr/kampanyalar', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });
    await page.waitForTimeout(5000);

    // Sayfa başlığını kontrol et
    const title = await page.title();
    console.log('📄 Sayfa başlığı:', title);

    // Tüm article, section, div elementlerini kontrol et
    const articles = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('article, section, [class*="campaign"], [class*="kampanya"], [class*="card"], [class*="item"], [class*="promo"]'));
      return elements.map(el => ({
        tag: el.tagName,
        classes: el.className,
        text: el.textContent.trim().substring(0, 150),
        hasLink: !!el.querySelector('a[href]'),
        link: el.querySelector('a[href]')?.href,
      })).slice(0, 15);
    });
    console.log('📰 Article/Section elementleri:', JSON.stringify(articles, null, 2));

    // H2, H3 başlıklarını bul
    const headings = await page.evaluate(() => {
      const h2h3 = Array.from(document.querySelectorAll('h2, h3, h4'));
      return h2h3.map(h => ({
        text: h.textContent.trim().substring(0, 100),
        tag: h.tagName,
        classes: h.className,
        parentClasses: h.parentElement?.className,
      })).slice(0, 20);
    });
    console.log('📝 H2/H3/H4 başlıklar:', JSON.stringify(headings, null, 2));

    // Tüm linkleri bul (kampanya içeren)
    const allLinks = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('a[href*="kampanya"], a[href*="campaign"]'));
      return anchors.map(a => ({
        href: a.href,
        text: a.textContent.trim().substring(0, 100),
        classes: a.className,
        parentTag: a.parentElement?.tagName,
        parentClasses: a.parentElement?.className,
      })).slice(0, 20);
    });
    console.log('🔗 Kampanya linkleri:', JSON.stringify(allLinks, null, 2));

    // Text-based parsing
    const textBased = await page.evaluate(() => {
      const allElements = Array.from(document.querySelectorAll('*'));
      return allElements
        .filter(el => {
          const text = el.textContent.toLowerCase();
          return (text.includes('kampanya') || text.includes('indirim') || text.includes('%') || text.match(/\d+\s*tl/i)) &&
                 text.length > 20 && text.length < 500;
        })
        .map(el => ({
          tag: el.tagName,
          classes: el.className,
          text: el.textContent.trim().substring(0, 200),
          hasLink: !!el.querySelector('a[href]'),
        }))
        .slice(0, 10);
    });
    console.log('📋 Text-based elementler:', JSON.stringify(textBased, null, 2));

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
    debugAkbankDetailed().then(() => {
      if (source === 'both') {
        return debugTurkcellDetailed();
      }
    }).catch(console.error);
  } else if (source === 'turkcell') {
    debugTurkcellDetailed().catch(console.error);
  }
}

module.exports = { debugAkbankDetailed, debugTurkcellDetailed };
