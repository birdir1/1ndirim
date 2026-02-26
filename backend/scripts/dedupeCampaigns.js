/**
 * De-dupe campaigns by URL or title+expires
 * Hides duplicates (is_hidden=true, is_active=false), keeps newest
 */

const pool = require('../src/config/database');

async function dedupeByUrl() {
  const query = `
    WITH ranked AS (
      SELECT
        id,
        source_id,
        original_url,
        scraped_at,
        created_at,
        ROW_NUMBER() OVER (
          PARTITION BY source_id, original_url
          ORDER BY scraped_at DESC NULLS LAST, created_at DESC
        ) AS rn,
        COUNT(*) OVER (PARTITION BY source_id, original_url) AS cnt
      FROM campaigns
      WHERE original_url IS NOT NULL AND original_url <> ''
        AND title IS NOT NULL AND TRIM(title) <> ''
    )
    UPDATE campaigns c
    SET is_hidden = true,
        is_active = false,
        updated_at = NOW()
    FROM ranked r
    WHERE c.id = r.id
      AND r.cnt > 1
      AND r.rn > 1
      AND c.title IS NOT NULL AND TRIM(c.title) <> ''
    RETURNING c.id;
  `;

  const res = await pool.query(query);
  return res.rowCount || 0;
}

async function dedupeByTitleExpires() {
  const query = `
    WITH ranked AS (
      SELECT
        id,
        source_id,
        LOWER(TRIM(title)) AS norm_title,
        expires_at,
        scraped_at,
        created_at,
        ROW_NUMBER() OVER (
          PARTITION BY source_id, LOWER(TRIM(title)), expires_at
          ORDER BY scraped_at DESC NULLS LAST, created_at DESC
        ) AS rn,
        COUNT(*) OVER (PARTITION BY source_id, LOWER(TRIM(title)), expires_at) AS cnt
      FROM campaigns
      WHERE (original_url IS NULL OR original_url = '')
        AND title IS NOT NULL AND TRIM(title) <> ''
    )
    UPDATE campaigns c
    SET is_hidden = true,
        is_active = false,
        updated_at = NOW()
    FROM ranked r
    WHERE c.id = r.id
      AND r.cnt > 1
      AND r.rn > 1
      AND c.title IS NOT NULL AND TRIM(c.title) <> ''
    RETURNING c.id;
  `;

  const res = await pool.query(query);
  return res.rowCount || 0;
}

async function main() {
  try {
    await pool.query('SELECT 1');
    const urlHidden = await dedupeByUrl();
    const titleHidden = await dedupeByTitleExpires();

    console.log(`✅ Dedupe complete. Hidden by URL: ${urlHidden}, by title+expires: ${titleHidden}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Dedupe failed:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { dedupeByUrl, dedupeByTitleExpires };
