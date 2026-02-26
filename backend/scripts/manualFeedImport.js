/**
 * Manual Feed Importer
 * CSV kolonları (UTF-8):
 * title,sourceName,platform,contentType,category,subCategory,startAt,endAt,isFree,discountPercent,city,district,lat,lng,originalUrl,affiliateUrl,tags,description
 *
 * Örnek:
 * "Epic Free Game","Epic Games","epic","game","gaming","free","2026-02-17","2026-02-24",true,100,"","",,,,,"%100 ücretsiz; haftalık oyun"
 *
 * Çalıştırma:
 *   node scripts/manualFeedImport.js data/manual_feed.csv
 */

const fs = require('fs');
const path = require('path');
const Campaign = require('../src/models/Campaign');
const pool = require('../src/config/database');

function guessSourceType(row) {
  const name = (row.sourceName || '').toLowerCase();
  const cat = (row.category || '').toLowerCase();
  if (name.match(/bank|finans|kart|kredi/)) return 'bank';
  if (name.match(/telekom|telekom|turkcell|vodafone|ttnet|bimcell|pttcell/)) return 'operator';
  if (cat === 'travel') return 'travel';
  if (cat === 'fashion') return 'retail';
  if (cat === 'culture') return 'culture';
  return 'retail';
}

async function ensureSource(row) {
  const sourceName = row.sourceName;
  let sourceId = await Campaign.getSourceIdByName(sourceName);
  if (sourceId) return sourceId;

  const type = guessSourceType(row);
  const site =
    row.originalUrl && row.originalUrl.startsWith('http')
      ? new URL(row.originalUrl).origin
      : null;

  const insertSql = `
    INSERT INTO sources (name, type, is_active, site, created_at, updated_at)
    VALUES ($1, $2, true, $3, NOW(), NOW())
    ON CONFLICT (name)
      DO UPDATE SET site = COALESCE(sources.site, EXCLUDED.site)
    RETURNING id
  `;
  const res = await pool.query(insertSql, [sourceName, type, site]);
  sourceId = res.rows[0].id;
  console.log(`🔗 Source oluşturuldu: ${sourceName} (${type})`);
  return sourceId;
}

async function parseCsv(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length <= 1) return [];
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"+|"+$/g, ''));
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.trim().replace(/^"+|"+$/g, ''));
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = cols[idx] || '';
    });
    rows.push(obj);
  }
  return rows;
}

async function main() {
  const filePath = process.argv[2] || path.join(__dirname, '../data/manual_feed.csv');
  if (!fs.existsSync(filePath)) {
    console.error(`Feed bulunamadı: ${filePath}`);
    process.exit(1);
  }

  const rows = await parseCsv(filePath);
  let ok = 0;
  let skip = 0;
  for (const row of rows) {
    console.log('ROW', row);
    const sourceId = await ensureSource(row);
    const tags = (row.tags || '')
      .split(/;|\|/)
      .map((t) => t.trim())
      .filter(Boolean);
    const expires = row.endAt || row.startAt || null;
    try {
      const expiresAt = expires || new Date(Date.now() + 7 * 24 * 3600 * 1000);
      const duplicate = await Campaign.findDuplicate(
        row.originalUrl || null,
        sourceId,
        row.title,
        null,
        expiresAt
      );

      if (duplicate) {
        await Campaign.update(duplicate.id, {
          title: row.title,
          description: row.description || row.subtitle || row.title,
          category: row.category || duplicate.category || 'gaming',
          subCategory: row.subCategory || duplicate.sub_category || null,
          platform: row.platform || duplicate.platform || null,
          contentType: row.contentType || duplicate.content_type || null,
          expiresAt,
          isFree: String(row.isFree || '').toLowerCase() === 'true',
          discountPercent: row.discountPercent ? Number(row.discountPercent) : null,
          tags,
          originalUrl: row.originalUrl || duplicate.original_url || null,
          affiliateUrl: row.affiliateUrl || duplicate.affiliate_url || null,
          isActive: true,
          status: 'active',
        });
        ok++;
        continue;
      }

      await Campaign.rawInsertMinimal({
        sourceId,
        title: row.title,
        description: row.description || row.subtitle || row.title,
        category: row.category || 'gaming',
        subCategory: row.subCategory || null,
        platform: row.platform || null,
        contentType: row.contentType || null,
        expiresAt,
        isFree: String(row.isFree || '').toLowerCase() === 'true',
        discountPercent: row.discountPercent ? Number(row.discountPercent) : null,
        tags,
        originalUrl: row.originalUrl || null,
        affiliateUrl: row.affiliateUrl || null,
      });
      ok++;
    } catch (e) {
      console.error(`Hata: ${row.title} -> ${e.message}`);
      skip++;
    }
  }

  console.log(`Import tamamlandı. Başarılı: ${ok}, Skip/Hata: ${skip}`);
  process.exit(0);
}

main().catch((e) => {
  console.error('Import başarısız:', e);
  process.exit(1);
});
