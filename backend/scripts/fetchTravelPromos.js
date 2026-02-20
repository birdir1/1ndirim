#!/usr/bin/env node
/**
 * Fetch travel/flight promos from Bilet.com campaigns page and emit CSV
 * compatible with manualFeedImport.js
 *
 * Columns:
 * title,sourceName,platform,contentType,category,subCategory,startAt,endAt,isFree,discountPercent,
 * city,district,lat,lng,originalUrl,affiliateUrl,tags,description
 *
 * Notes:
 * - endAt is best-effort (date text if found), otherwise empty.
 * - Keywords akbank/turk telekom/turkcell are tagged for visibility in feeds.
 */
const axios = require('axios');
const cheerio = require('cheerio');
const dayjs = require('dayjs');

const CAMPAIGNS_URL = 'https://www.bilet.com/kampanyalar';

function toCsvRow(row) {
  const fields = [
    row.title,
    row.sourceName,
    row.platform,
    row.contentType,
    row.category,
    row.subCategory,
    row.startAt || '',
    row.endAt || '',
    row.isFree ? 'true' : 'false',
    row.discountPercent ?? '',
    row.city ?? '',
    row.district ?? '',
    row.lat ?? '',
    row.lng ?? '',
    row.originalUrl ?? '',
    row.affiliateUrl ?? '',
    row.tags?.join(';') ?? '',
    row.description ?? '',
  ];
  return fields
    .map((f) => {
      const v = f == null ? '' : String(f);
      if (v.includes(',') || v.includes('"') || v.includes('\n')) {
        return `"${v.replace(/"/g, '""')}"`;
      }
      return v;
    })
    .join(',');
}

async function fetchBiletCom() {
  const res = await axios.get(CAMPAIGNS_URL, { timeout: 15000 });
  const $ = cheerio.load(res.data);
  const cards = $('.campaign-card, .kampanya-card, .card');
  const rows = [];

  cards.each((_, el) => {
    const title = $(el).find('h2, h3, .title').first().text().trim();
    if (!title) return;
    const desc = $(el).find('p, .desc, .description').first().text().trim();
    const href = $(el).find('a').attr('href');
    const url = href && href.startsWith('http') ? href : CAMPAIGNS_URL;

    // heuristic: only keep flight / bilet promos
    const text = `${title} ${desc}`.toLowerCase();
    if (!text.match(/uçak|bilet|flight/)) return;

    const discount = text.match(/(\\d{2,4})\\s*tl/)?.[1];
    const endText = text.match(/(\\d{1,2}\\s+[a-zçğıöşü]+\\s+20\\d{2})/i)?.[1];
    const endAt = endText ? dayjs(endText, 'D MMMM YYYY', 'tr').format('YYYY-MM-DD') : '';

    const tags = [];
    ['akbank', 'türk telekom', 'turk telekom', 'turkcell', 'vodafone'].forEach((kw) => {
      if (text.includes(kw)) tags.push(kw.replace(/\s+/g, ''));
    });

    rows.push({
      title,
      sourceName: 'Bilet.com',
      platform: 'web',
      contentType: 'travel',
      category: 'travel',
      subCategory: 'flight',
      startAt: '',
      endAt,
      isFree: false,
      discountPercent: '',
      originalUrl: url,
      affiliateUrl: '',
      tags: ['biletcom', 'ucak', ...tags],
      description: desc || title,
    });
  });

  return rows;
}

(async () => {
  try {
    const rows = await fetchBiletCom();
    console.log(
      'title,sourceName,platform,contentType,category,subCategory,startAt,endAt,isFree,discountPercent,city,district,lat,lng,originalUrl,affiliateUrl,tags,description',
    );
    rows.forEach((r) => console.log(toCsvRow(r)));
    if (!rows.length) {
      console.error('⚠️  Bilet.com kampanya bulunamadı');
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ Fetch failed:', err.message);
    process.exit(1);
  }
})();
