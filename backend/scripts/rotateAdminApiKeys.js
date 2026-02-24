#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const pool = require('../src/config/database');

function arg(name) {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return null;
  return process.argv[idx + 1] || null;
}

async function main() {
  const onlyEmail = arg('--email');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outFile = path.resolve(process.cwd(), `.admin-api-keys-${timestamp}.txt`);

  const whereClause = onlyEmail ? 'WHERE is_active = true AND email = $1' : 'WHERE is_active = true';
  const params = onlyEmail ? [onlyEmail.trim().toLowerCase()] : [];
  const adminsResult = await pool.query(
    `SELECT email FROM admin_users ${whereClause} ORDER BY email ASC`,
    params,
  );

  if (adminsResult.rows.length === 0) {
    throw new Error('No active admin users found for rotation.');
  }

  const lines = [];
  for (const row of adminsResult.rows) {
    const email = String(row.email).trim().toLowerCase();
    const key = crypto.randomBytes(32).toString('hex');
    await pool.query(
      'UPDATE admin_users SET admin_api_key = $1, updated_at = NOW() WHERE email = $2',
      [key, email],
    );
    lines.push(`${email}=${key}`);
  }

  fs.writeFileSync(outFile, `${lines.join('\n')}\n`, { mode: 0o600 });
  fs.chmodSync(outFile, 0o600);

  const verifyResult = await pool.query(
    `SELECT email, LEFT(admin_api_key, 8) || '...' AS key_prefix, updated_at
     FROM admin_users ${whereClause} ORDER BY email ASC`,
    params,
  );

  console.log(`Rotated ${lines.length} admin key(s).`);
  console.log(`Stored full keys in: ${outFile}`);
  console.table(verifyResult.rows);
}

main()
  .catch((error) => {
    console.error('Admin API key rotation failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });

