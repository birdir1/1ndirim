#!/usr/bin/env node

/**
 * Referral System Setup Script
 * 
 * Bu script referral tablolarını oluşturur
 * 
 * Kullanım:
 * - node src/scripts/setup_referral.js
 */

const fs = require('fs');
const path = require('path');
const pool = require('../config/database');
require('dotenv').config();

async function setupReferral() {
  console.log('='.repeat(60));
  console.log('🎁 REFERRAL SYSTEM SETUP');
  console.log('='.repeat(60));
  console.log(`📅 Tarih: ${new Date().toLocaleString('tr-TR')}`);
  console.log(`🗄️  Database: ${process.env.DB_NAME}`);
  console.log('='.repeat(60));
  console.log('');

  const client = await pool.connect();
  
  try {
    // SQL dosyasını oku
    const sqlPath = path.join(__dirname, 'create_referral_tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 SQL dosyası okundu: create_referral_tables.sql');
    console.log('');
    
    // SQL'i çalıştır
    console.log('🔄 Referral tabloları oluşturuluyor...');
    await client.query(sql);
    console.log('✅ Referral tabloları oluşturuldu');
    console.log('');
    
    // Tablo bilgilerini göster
    console.log('='.repeat(60));
    console.log('📋 TABLO BİLGİLERİ:');
    console.log('');
    
    const tableInfo = await client.query(`
      SELECT 
        table_name,
        (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public'
        AND table_name IN ('user_referrals', 'referral_codes', 'referral_rewards')
      ORDER BY table_name
    `);
    
    tableInfo.rows.forEach((table) => {
      console.log(`  📊 ${table.table_name}: ${table.column_count} sütun`);
    });
    
    console.log('');
    console.log('='.repeat(60));
    console.log('🔍 INDEX BİLGİLERİ:');
    console.log('');
    
    const indexInfo = await client.query(`
      SELECT 
        tablename,
        indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename IN ('user_referrals', 'referral_codes', 'referral_rewards')
      ORDER BY tablename, indexname
    `);
    
    let currentTable = '';
    indexInfo.rows.forEach((idx) => {
      if (idx.tablename !== currentTable) {
        if (currentTable !== '') console.log('');
        console.log(`  📊 ${idx.tablename}:`);
        currentTable = idx.tablename;
      }
      console.log(`     - ${idx.indexname}`);
    });
    
    console.log('');
    console.log('='.repeat(60));
    console.log('✅ Referral system setup tamamlandı!');
    console.log('='.repeat(60));
    console.log('');
    console.log('💡 ÖNERİLER:');
    console.log('  1. Referral API endpoint\'lerini test edin:');
    console.log('     GET /api/referrals/code');
    console.log('     POST /api/referrals/apply');
    console.log('     GET /api/referrals/stats');
    console.log('     GET /api/referrals/history');
    console.log('');
    console.log('  2. Flutter app\'te referral ekranını test edin');
    console.log('');
    console.log('  3. Test referral code oluşturmak için:');
    console.log('     SELECT get_or_create_referral_code(\'test_user_id\');');
    console.log('');
    
  } catch (error) {
    console.error('');
    console.error('='.repeat(60));
    console.error('❌ REFERRAL SETUP BAŞARISIZ');
    console.error('='.repeat(60));
    console.error(error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Script'i çalıştır
setupReferral()
  .then(() => {
    console.log('👋 Çıkış yapılıyor...');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
