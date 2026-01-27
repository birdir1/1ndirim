/**
 * İlk admin kullanıcısını ekler
 * 
 * Kullanım:
 * node src/scripts/add-first-admin.js <email> <role>
 * 
 * Örnek:
 * node src/scripts/add-first-admin.js admin@birdir1.com super_admin
 */

require('dotenv').config();
const pool = require('../config/database');
const crypto = require('crypto');

const email = process.argv[2];
const role = process.argv[3] || 'super_admin';

if (!email) {
  console.error('❌ Email gerekli!');
  console.error('Kullanım: node src/scripts/add-first-admin.js <email> [role]');
  console.error('Örnek: node src/scripts/add-first-admin.js admin@birdir1.com super_admin');
  process.exit(1);
}

const validRoles = ['super_admin', 'editor', 'viewer'];
if (!validRoles.includes(role)) {
  console.error(`❌ Geçersiz role: ${role}`);
  console.error(`Geçerli roller: ${validRoles.join(', ')}`);
  process.exit(1);
}

async function addFirstAdmin() {
  try {
    // Veritabanı bağlantısını test et
    await pool.query('SELECT 1');
    console.log('✅ Veritabanı bağlantısı başarılı\n');

    // Email'in zaten var olup olmadığını kontrol et
    const checkResult = await pool.query(
      'SELECT id, email, role FROM admin_users WHERE email = $1',
      [email]
    );

    if (checkResult.rows.length > 0) {
      const existing = checkResult.rows[0];
      console.log(`⚠️ Bu email zaten mevcut:`);
      console.log(`   ID: ${existing.id}`);
      console.log(`   Email: ${existing.email}`);
      console.log(`   Role: ${existing.role}`);
      console.log(`\nYeni admin eklemek için farklı bir email kullanın.\n`);
      process.exit(0);
    }

    // API key oluştur (development için)
    const apiKey = crypto.randomBytes(32).toString('hex');

    // Admin user ekle
    const result = await pool.query(
      `INSERT INTO admin_users (email, role, admin_api_key, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING id, email, role, admin_api_key, created_at`,
      [email, role, apiKey]
    );

    const admin = result.rows[0];

    console.log('✅ Admin kullanıcısı başarıyla eklendi!\n');
    console.log('='.repeat(60));
    console.log('📧 Email:', admin.email);
    console.log('👤 Role:', admin.role);
    console.log('🔑 API Key:', admin.admin_api_key);
    console.log('🆔 ID:', admin.id);
    console.log('📅 Oluşturulma:', admin.created_at);
    console.log('='.repeat(60));
    console.log('\n⚠️ ÖNEMLİ: API Key\'i güvenli bir yerde saklayın!');
    console.log('   Admin panel\'e giriş yapmak için bu API Key\'i kullanacaksınız.\n');

    await pool.end();
  } catch (error) {
    console.error('❌ Hata:', error.message);
    if (error.code === '42P01') {
      console.error('\n⚠️ admin_users tablosu bulunamadı!');
      console.error('   Önce migration\'ları çalıştırın:');
      console.error('   node src/scripts/run-all-migrations.js\n');
    }
    process.exit(1);
  }
}

addFirstAdmin();
