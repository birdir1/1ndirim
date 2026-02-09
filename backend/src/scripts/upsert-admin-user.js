/**
 * Upsert admin user (idempotent).
 *
 * Usage:
 *   node src/scripts/upsert-admin-user.js <email> [role] [apiKey]
 *
 * Notes:
 * - Does not print the API key by default.
 * - If admin_users table is missing, attempts to run the FAZ 10 migration.
 */

require('dotenv').config();
const crypto = require('crypto');
const pool = require('../config/database');

const emailArg = process.argv[2];
const roleArg = process.argv[3] || 'super_admin';
const apiKeyArg = process.argv[4] || null;
const printKey = process.argv.includes('--print-key');

if (!emailArg) {
  console.error('❌ Email gerekli!');
  console.error('Kullanım: node src/scripts/upsert-admin-user.js <email> [role] [apiKey]');
  process.exit(1);
}

const validRoles = ['super_admin', 'editor', 'viewer'];
if (!validRoles.includes(roleArg)) {
  console.error(`❌ Geçersiz role: ${roleArg}`);
  console.error(`Geçerli roller: ${validRoles.join(', ')}`);
  process.exit(1);
}

async function ensureAdminUsersTable() {
  try {
    await pool.query('SELECT 1 FROM admin_users LIMIT 1');
    return;
  } catch (e) {
    if (e && e.code === '42P01') {
      // Table does not exist; run the migration.
      const migrate = require('./migrations/add_admin_users');
      await migrate();
      return;
    }
    throw e;
  }
}

async function main() {
  try {
    await pool.query('SELECT 1');
    await ensureAdminUsersTable();

    const email = String(emailArg).trim().toLowerCase();
    const apiKey = apiKeyArg ? String(apiKeyArg).trim() : crypto.randomBytes(32).toString('hex');

    const existing = await pool.query(
      'SELECT id, email, role, is_active FROM admin_users WHERE email = $1',
      [email],
    );

    if (existing.rows.length === 0) {
      const created = await pool.query(
        `INSERT INTO admin_users (email, role, admin_api_key, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, true, NOW(), NOW())
         RETURNING id, email, role, is_active`,
        [email, roleArg, apiKey],
      );

      console.log('✅ Admin created');
      console.log(`   email=${created.rows[0].email}`);
      console.log(`   role=${created.rows[0].role}`);
      console.log(`   active=${created.rows[0].is_active}`);
      if (printKey) console.log(`   api_key=${apiKey}`);
      return;
    }

    const updated = await pool.query(
      `UPDATE admin_users
       SET role = $2,
           admin_api_key = $3,
           is_active = true,
           updated_at = NOW()
       WHERE email = $1
       RETURNING id, email, role, is_active`,
      [email, roleArg, apiKey],
    );

    console.log('✅ Admin updated');
    console.log(`   email=${updated.rows[0].email}`);
    console.log(`   role=${updated.rows[0].role}`);
    console.log(`   active=${updated.rows[0].is_active}`);
    if (printKey) console.log(`   api_key=${apiKey}`);
  } finally {
    try { await pool.end(); } catch (_) {}
  }
}

main().catch((e) => {
  console.error('❌ Script error:', e && e.message ? e.message : e);
  process.exit(1);
});

