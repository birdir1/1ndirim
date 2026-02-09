/**
 * Merge one source into another by moving campaigns.source_id.
 *
 * Use case: "Bankkart" campaigns should appear under "Ziraat Bankası".
 * This is a data migration script without DB schema changes.
 *
 * Usage:
 *   node src/scripts/merge-source-into.js "Bankkart" "Ziraat Bankası"
 *
 * Notes:
 * - Reads DB connection from existing backend config (.env).
 * - Idempotent: safe to run multiple times.
 */

const pool = require('../config/database');

async function findSourceByName(client, name) {
  // Prefer exact match first, then case-insensitive match.
  const exact = await client.query(`SELECT id, name FROM sources WHERE name = $1 LIMIT 1`, [name]);
  if (exact.rows[0]) return exact.rows[0];

  const ilike = await client.query(`SELECT id, name FROM sources WHERE name ILIKE $1 LIMIT 1`, [name]);
  if (ilike.rows[0]) return ilike.rows[0];

  return null;
}

async function mergeSourceInto(fromName, toName) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const from = await findSourceByName(client, fromName);
    const to = await findSourceByName(client, toName);

    if (!from) {
      throw new Error(`Source not found (from): ${fromName}`);
    }
    if (!to) {
      throw new Error(`Source not found (to): ${toName}`);
    }
    if (from.id === to.id) {
      console.log('No-op: from and to are the same source id.');
      await client.query('COMMIT');
      return { moved: 0, from, to };
    }

    const before = await client.query(`SELECT COUNT(*)::int AS c FROM campaigns WHERE source_id = $1`, [from.id]);
    const beforeCount = before.rows[0] ? before.rows[0].c : 0;

    const updated = await client.query(
      `UPDATE campaigns SET source_id = $1, updated_at = NOW() WHERE source_id = $2`,
      [to.id, from.id]
    );

    // pg's UPDATE rowCount is enough; no need to RETURNING potentially huge payload.
    const moved = updated.rowCount || 0;

    await client.query('COMMIT');

    console.log(`Merged source campaigns: "${from.name}" -> "${to.name}"`);
    console.log(`Campaigns before (from): ${beforeCount}`);
    console.log(`Campaigns moved: ${moved}`);

    return { moved, from, to };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  const fromName = process.argv[2];
  const toName = process.argv[3];

  if (!fromName || !toName) {
    console.error('Usage: node src/scripts/merge-source-into.js "From Source" "To Source"');
    process.exit(1);
  }

  mergeSourceInto(fromName, toName)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Merge failed:', err.message);
      process.exit(1);
    });
}

module.exports = { mergeSourceInto };
