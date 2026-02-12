/**
 * Reprocess all campaigns using the new campaign normalizer.
 * Usage: NODE_ENV=development node scripts/reprocessCampaigns.js
 */

const pool = require('../src/config/database');
const Campaign = require('../src/models/Campaign');
const { normalizeCampaignText } = require('../src/services/campaignNormalizer');

async function fetchAllCampaigns() {
  const res = await pool.query(`
    SELECT c.*, s.name AS source_name
    FROM campaigns c
    LEFT JOIN sources s ON s.id = c.source_id
    WHERE c.is_active = true
  `);
  return res.rows;
}

async function run() {
  const campaigns = await fetchAllCampaigns();
  let fixed = 0;
  let needsReview = 0;

  for (const c of campaigns) {
    const rawText = [c.title, c.description, c.detail_text].filter(Boolean).join(' ');
    const result = await normalizeCampaignText({
      bankName: c.source_name || 'Bilinmeyen Kaynak',
      rawHtml: c.raw_content,
      rawText,
      sourceUrl: c.source_url || c.original_url,
    });

    const updates = {
      normalized_content: result.normalizedContent,
      raw_content: result.rawContent,
      source_url: result.sourceUrl || c.source_url || c.original_url,
      is_valid: result.isValid,
      needs_review: result.needsReview,
      invalid_reason: result.invalidReason,
      title: result.normalizedContent.title || c.title,
      description: result.normalizedContent.shortDescription || c.description,
      detail_text: result.normalizedContent.detailText || c.detail_text,
    };

    await Campaign.update(c.id, updates);

    if (result.needsReview) {
      needsReview += 1;
      console.warn(`[CAMPAIGN_TOO_SHORT] id=${c.id} source=${c.source_name} reason=${result.invalidReason}`);
    } else if (!result.isValid) {
      needsReview += 1;
      console.warn(`[CAMPAIGN_INVALID] id=${c.id} source=${c.source_name} reason=${result.invalidReason}`);
    } else {
      fixed += 1;
      console.log(`[CAMPAIGN_NORMALIZED] id=${c.id} source=${c.source_name} title="${result.normalizedContent.title}"`);
    }
  }

  console.log(`Reprocess complete. fixed=${fixed} needsReview=${needsReview}`);
  process.exit(0);
}

run().catch((err) => {
  console.error('Reprocess failed:', err);
  process.exit(1);
});
