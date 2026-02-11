#!/usr/bin/env node

/**
 * Database Optimization Runner
 * 
 * Bu script optimize_database.sql dosyasını çalıştırır ve
 * database performansını iyileştirir.
 * 
 * Kullanım:
 * - node src/scripts/run_optimization.js
 */

const fs = require('fs');
const path = require('path');
const pool = require('../config/database');
require('dotenv').config();

async function runOptimization() {
  console.log('='.repeat(60));
  console.log('🚀 DATABASE OPTIMIZATION');
  console.log('='.repeat(60));
  console.log(`📅 Tarih: ${new Date().toLocaleString('tr-TR')}`);
  console.log(`🗄️  Database: ${process.env.DB_NAME}`);
  console.log(`🖥️  Host: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
  console.log('='.repeat(60));
  console.log('');

  const client = await pool.connect();
  
  try {
    // SQL dosyasını oku
    const sqlPath = path.join(__dirname, 'optimize_database.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 SQL dosyası okundu: optimize_database.sql');
    console.log('');
    
    // SQL'i satırlara böl ve yorumları/boş satırları temizle
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`📊 Toplam ${statements.length} SQL statement bulundu`);
    console.log('');
    
    // Her statement'ı çalıştır
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Verification query'leri atla (SELECT)
      if (statement.toUpperCase().startsWith('SELECT')) {
        skipCount++;
        continue;
      }
      
      try {
        // Statement'ı çalıştır
        await client.query(statement + ';');
        
        // Index oluşturma mesajlarını göster
        if (statement.toUpperCase().includes('CREATE INDEX')) {
          const indexName = statement.match(/idx_\w+/)?.[0] || 'unknown';
          console.log(`  ✅ Index oluşturuldu: ${indexName}`);
        } else if (statement.toUpperCase().includes('ANALYZE')) {
          const tableName = statement.match(/ANALYZE (\w+)/)?.[1] || 'unknown';
          console.log(`  📊 Analyze tamamlandı: ${tableName}`);
        } else {
          console.log(`  ✅ Statement ${i + 1} tamamlandı`);
        }
        
        successCount++;
      } catch (error) {
        // Index zaten varsa hata verme
        if (error.message.includes('already exists')) {
          console.log(`  ⚠️  Index zaten var (atlandı)`);
          skipCount++;
        } else {
          console.error(`  ❌ Hata: ${error.message}`);
          errorCount++;
        }
      }
    }
    
    console.log('');
    console.log('='.repeat(60));
    console.log('📊 ÖZET');
    console.log('='.repeat(60));
    console.log(`✅ Başarılı: ${successCount}`);
    console.log(`⚠️  Atlanan: ${skipCount}`);
    console.log(`❌ Hatalı: ${errorCount}`);
    console.log('='.repeat(60));
    console.log('');
    
    // Index'leri listele
    console.log("📋 OLUŞTURULAN INDEX'LER:");
    console.log('');
    
    const indexResult = await client.query(`
      SELECT 
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND indexname LIKE 'idx_%'
      ORDER BY tablename, indexname
    `);
    
    let currentTable = '';
    indexResult.rows.forEach(row => {
      if (row.tablename !== currentTable) {
        console.log('');
        console.log(`📁 ${row.tablename}:`);
        currentTable = row.tablename;
      }
      console.log(`  - ${row.indexname}`);
    });
    
    console.log('');
    console.log('='.repeat(60));
    
    // Table boyutlarını göster
    console.log('💾 TABLE BOYUTLARI:');
    console.log('');
    
    const sizeResult = await client.query(`
      SELECT 
        tablename,
        pg_size_pretty(pg_total_relation_size('public.'||tablename)) AS size,
        pg_total_relation_size('public.'||tablename) AS bytes
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size('public.'||tablename) DESC
    `);
    
    sizeResult.rows.forEach(row => {
      console.log(`  ${row.tablename.padEnd(30)} ${row.size}`);
    });
    
    console.log('');
    console.log('='.repeat(60));
    console.log('✅ Optimization tamamlandı!');
    console.log('='.repeat(60));
    console.log('');
    console.log('💡 ÖNERİLER:');
    console.log('  1. EXPLAIN ANALYZE ile query performansını test edin');
    console.log('  2. pg_stat_statements ile slow query\'leri izleyin');
    console.log('  3. Düzenli olarak VACUUM ANALYZE çalıştırın');
    console.log('  4. Connection pooling ayarlarını kontrol edin');
    console.log('');
    
  } catch (error) {
    console.error('');
    console.error('='.repeat(60));
    console.error('❌ OPTIMIZATION BAŞARISIZ');
    console.error('='.repeat(60));
    console.error(error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Script'i çalıştır
runOptimization()
  .then(() => {
    console.log('👋 Çıkış yapılıyor...');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
