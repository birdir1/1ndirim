/**
 * Deactivate a source and disable all its campaigns (no schema changes).
 *
 * Usage:
 *   node src/scripts/deactivate-source-by-name.js "Source Name"
 *
 * Effects:
 * - sources.is_active = false
 * - campaigns.is_active = false, campaigns.is_hidden = true
 *
 * Safe to run multiple times.
 */

const pool = require('../config/database');

async function findSource(client, name) {
  const exact = await client.query(`SELECT id, name, is_active FROM sources WHERE name = $1 LIMIT 1`, [name]);
  if (exact.rows[0]) return exact.rows[0];

  const ilike = await client.query(`SELECT id, name, is_active FROM sources WHERE name ILIKE $1 LIMIT 1`, [name]);
  if (ilike.rows[0]) return ilike.rows[0];

  return null;
}

async function deactivateSourceByName(name) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const source = await findSource(client, name);
    if (!source) throw new Error(`Source not found: ${name}`);

    await client.query(`UPDATE sources SET is_active = false, updated_at = NOW() WHERE id = $1`, [source.id]);

    const updated = await client.query(
      `UPDATE campaigns
       SET is_active = false,
           is_hidden = true,
           updated_at = NOW()
       WHERE source_id = $1`,
      [source.id],
    );

    await client.query('COMMIT');

    console.log(`Deactivated source: ${source.name}`);
    console.log(`Campaigns disabled: ${updated.rowCount || 0}`);

    return { source, disabledCampaigns: updated.rowCount || 0 };
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  const name = process.argv.slice(2).join(' ').trim();
  if (!name) {
    console.error('Usage: node src/scripts/deactivate-source-by-name.js "Source Name"');
    process.exit(1);
  }
  deactivateSourceByName(name)
    .then(() => process.exit(0))
    .catch((e) => {
      console.error('Deactivate failed:', e.message);
      process.exit(1);
    });
}

module.exports = { deactivateSourceByName };
