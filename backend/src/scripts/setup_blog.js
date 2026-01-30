#!/usr/bin/env node

/**
 * Blog Setup Script
 * 
 * Bu script blog tablolarını oluşturur ve örnek veri ekler
 * 
 * Kullanım:
 * - node src/scripts/setup_blog.js
 */

const fs = require('fs');
const path = require('path');
const pool = require('../config/database');
require('dotenv').config();

async function setupBlog() {
  console.log('='.repeat(60));
  console.log('📝 BLOG SETUP');
  console.log('='.repeat(60));
  console.log(`📅 Tarih: ${new Date().toLocaleString('tr-TR')}`);
  console.log(`🗄️  Database: ${process.env.DB_NAME}`);
  console.log('='.repeat(60));
  console.log('');

  const client = await pool.connect();
  
  try {
    // SQL dosyasını oku
    const sqlPath = path.join(__dirname, 'create_blog_tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 SQL dosyası okundu: create_blog_tables.sql');
    console.log('');
    
    // SQL'i çalıştır
    console.log('🔄 Blog tabloları oluşturuluyor...');
    await client.query(sql);
    console.log('✅ Blog tabloları oluşturuldu');
    console.log('');
    
    // Kategori sayısını kontrol et
    const categoryResult = await client.query(
      'SELECT COUNT(*) as count FROM blog_categories'
    );
    const categoryCount = parseInt(categoryResult.rows[0].count);
    console.log(`📁 Kategori sayısı: ${categoryCount}`);
    
    // Post sayısını kontrol et
    const postResult = await client.query(
      'SELECT COUNT(*) as count FROM blog_posts'
    );
    const postCount = parseInt(postResult.rows[0].count);
    console.log(`📝 Blog yazısı sayısı: ${postCount}`);
    
    console.log('');
    console.log('='.repeat(60));
    
    // Kategorileri listele
    console.log('📋 BLOG KATEGORİLERİ:');
    console.log('');
    
    const categories = await client.query(`
      SELECT name, slug, display_order
      FROM blog_categories
      WHERE is_active = true
      ORDER BY display_order ASC
    `);
    
    categories.rows.forEach((cat, index) => {
      console.log(`  ${index + 1}. ${cat.name} (${cat.slug})`);
    });
    
    console.log('');
    console.log('='.repeat(60));
    
    // Blog yazılarını listele
    console.log('📝 BLOG YAZILARI:');
    console.log('');
    
    const posts = await client.query(`
      SELECT 
        bp.title,
        bp.slug,
        bp.is_featured,
        bc.name as category_name
      FROM blog_posts bp
      LEFT JOIN blog_categories bc ON bp.category_id = bc.id
      WHERE bp.is_published = true
      ORDER BY bp.published_at DESC
    `);
    
    posts.rows.forEach((post, index) => {
      const featured = post.is_featured ? '⭐' : '  ';
      console.log(`  ${featured} ${index + 1}. ${post.title}`);
      console.log(`     Kategori: ${post.category_name || 'Yok'}`);
      console.log(`     Slug: ${post.slug}`);
      console.log('');
    });
    
    console.log('='.repeat(60));
    console.log('✅ Blog setup tamamlandı!');
    console.log('='.repeat(60));
    console.log('');
    console.log('💡 ÖNERİLER:');
    console.log('  1. Blog API endpoint\'lerini test edin:');
    console.log('     GET /api/blog/categories');
    console.log('     GET /api/blog/posts');
    console.log('     GET /api/blog/posts/:slug');
    console.log('     GET /api/blog/featured');
    console.log('');
    console.log('  2. Flutter app\'te blog ekranını test edin');
    console.log('');
    console.log('  3. Yeni blog yazıları eklemek için database\'e insert yapın');
    console.log('');
    
  } catch (error) {
    console.error('');
    console.error('='.repeat(60));
    console.error('❌ BLOG SETUP BAŞARISIZ');
    console.error('='.repeat(60));
    console.error(error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Script'i çalıştır
setupBlog()
  .then(() => {
    console.log('👋 Çıkış yapılıyor...');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
