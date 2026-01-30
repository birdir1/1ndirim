#!/usr/bin/env node

/**
 * Price Tracking Setup Script
 * 
 * Bu script fiyat takibi tablolarını oluşturur ve mevcut kampanyalar için
 * ilk fiyat kayıtlarını ekler
 * 
 * Kullanım:
 * - node src/scripts/setup_price_tracking.js
 */

const fs = require('fs');
const path = require('path');
const pool = require('../config/database');
require('dotenv').config();

async function setupPriceTracking() {
  console.log('='.repeat(60));
  console.log('💰 PRICE TRACKING SETUP');
  console.log('='.repeat(60));
  console.log(`📅 Tarih: ${new Date().toLocaleString('tr-TR')}`);
  console.log(`🗄️  Database: ${process.env.DB_NAME}`);
  console.log('='.repeat(60));
  console.log('');

  const client = await pool.connect();
  
  try {
    // SQL dosyasını oku
    const sqlPath = path.join(__dirname, 'create_price_tracking_tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 SQL dosyası okundu: create_price_tracking_tables.sql');
    console.log('');
    
    // SQL'i çalıştır
    console.log('🔄 Price tracking tabloları oluşturuluyor...');
    await client.query(sql);
    console.log('✅ Price tracking tabloları oluşturuldu');
    console.log('');
    
    // Fiyat geçmişi kayıt sayısını kontrol et
    const historyResult = await client.query(
      'SELECT COUNT(*) as count FROM campaign_price_history'
    );
    const historyCount = parseInt(historyResult.rows[0].count);
    console.log(`📊 Fiyat geçmişi kayıt sayısı: ${historyCount}`);
    
    // Aktif kampanya sayısını kontrol et
    const campaignResult = await client.query(
      'SELECT COUNT(*) as count FROM campaigns WHERE is_active = true AND current_price IS NOT NULL'
    );
    const campaignCount = parseInt(campaignResult.rows[0].count);
    console.log(`🎯 Fiyatı olan aktif kampanya sayısı: ${campaignCount}`);
    
    console.log('');
    console.log('='.repeat(60));
    console.log('📋 TABLO BİLGİLERİ:');
    console.log('');
    
    // Tablo bilgilerini göster
    const tableInfo = await client.query(`
      SELECT 
        table_name,
        (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public'
        AND table_name IN ('user_price_tracking', 'campaign_price_history')
      ORDER BY table_name
    `);
    
    tableInfo.rows.forEach((table) => {
      console.log(`  📊 ${table.table_name}: ${table.column_count} sütun`);
    });
    
    console.log('');
    console.log('='.repeat(60));
    console.log('🔍 INDEX BİLGİLERİ:');
    console.log('');
    
    // Index bilgilerini göster
    const indexInfo = await client.query(`
      SELECT 
        tablename,
        indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename IN ('user_price_tracking', 'campaign_price_history')
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
    console.log('✅ Price tracking setup tamamlandı!');
    console.log('='.repeat(60));
    console.log('');
    console.log('💡 ÖNERİLER:');
    console.log('  1. Price tracking API endpoint\'lerini test edin:');
    console.log('     POST /api/price-tracking/:campaignId');
    console.log('     GET /api/price-tracking');
    console.log('     GET /api/price-tracking/:campaignId/history');
    console.log('     DELETE /api/price-tracking/:campaignId');
    console.log('');
    console.log('  2. Flutter app\'te price tracking ekranını test edin');
    console.log('');
    console.log('  3. Fiyat değişikliklerini test etmek için:');
    console.log('     UPDATE campaigns SET current_price = 99.99 WHERE id = \'...\';');
    console.log('     (Otomatik olarak campaign_price_history\'ye kaydedilecek)');
    console.log('');
    console.log('  4. Bildirim sistemi için cron job ekleyin (gelecekte)');
    console.log('');
    
  } catch (error) {
    console.error('');
    console.error('='.repeat(60));
    console.error('❌ PRICE TRACKING SETUP BAŞARISIZ');
    console.error('='.repeat(60));
    console.error(error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Script'i çalıştır
setupPriceTracking()
  .then(() => {
    console.log('👋 Çıkış yapılıyor...');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
