#!/usr/bin/env node
/**
 * Fetch Epic Games weekly free titles and output CSV rows compatible with manualFeedImport.js
 * Columns: title,sourceName,platform,contentType,category,subCategory,startAt,endAt,isFree,discountPercent,city,district,lat,lng,originalUrl,affiliateUrl,tags,description
 */
const axios = require('axios');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

const EPIC_URL =
  'https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions?locale=tr&country=TR&allowCountries=TR';

async function fetchFreeGames() {
  const res = await axios.get(EPIC_URL, { timeout: 10000 });
  const elements = res.data?.data?.Catalog?.searchStore?.elements || [];
  const rows = [];

  for (const el of elements) {
    // Determine active promotion with date window
    const promo = (el.promotions?.promotionalOffers || []).flatMap((p) => p.promotionalOffers)[0]
      || (el.promotions?.upcomingPromotionalOffers || []).flatMap((p) => p.promotionalOffers)[0];
    if (!promo) continue;

    const startAt = promo.startDate ? dayjs(promo.startDate).tz('Europe/Istanbul').format('YYYY-MM-DD') : '';
    const endAt = promo.endDate ? dayjs(promo.endDate).tz('Europe/Istanbul').format('YYYY-MM-DD') : '';

    const title = el.title || 'Epic Free Game';
    const desc = el.description || 'Epic Games haftalık ücretsiz oyun';
    const url = `https://store.epicgames.com/p/${(el.productSlug || '').replace(/^\/|\/$/g, '')}`;
    const discountPercent = promo.discountSetting?.discountPercentage ?? 100;

    rows.push({
      title,
      sourceName: 'Epic Games',
      platform: 'epic',
      contentType: 'game',
      category: 'gaming',
      subCategory: 'free',
      startAt,
      endAt,
      isFree: true,
      discountPercent,
      city: '',
      district: '',
      lat: '',
      lng: '',
      originalUrl: url,
      affiliateUrl: '',
      tags: ['epic', 'free', 'pc'].join(';'),
      description: desc,
    });
  }
  return rows;
}

function toCsvRow(row) {
  const fields = [
    row.title,
    row.sourceName,
    row.platform,
    row.contentType,
    row.category,
    row.subCategory,
    row.startAt,
    row.endAt,
    row.isFree ? 'true' : 'false',
    row.discountPercent,
    row.city,
    row.district,
    row.lat,
    row.lng,
    row.originalUrl,
    row.affiliateUrl,
    row.tags,
    row.description,
  ];
  return fields
    .map((f) => {
      const v = f == null ? '' : String(f);
      if (v.includes(',') || v.includes('"') || v.includes('\n')) {
        return '"' + v.replace(/"/g, '""') + '"';
      }
      return v;
    })
    .join(',');
}

(async () => {
  try {
    const rows = await fetchFreeGames();
    // Header (compatible with manual_feed.csv)
    console.log(
      'title,sourceName,platform,contentType,category,subCategory,startAt,endAt,isFree,discountPercent,city,district,lat,lng,originalUrl,affiliateUrl,tags,description',
    );
    rows.forEach((r) => console.log(toCsvRow(r)));
    if (!rows.length) {
      console.error('⚠️  Epic free list empty');
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ Epic fetch failed:', err.message);
    process.exit(1);
  }
})();
