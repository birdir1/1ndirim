const pool = require('../../config/database');

/**
 * Migration: blog_posts tablosu.
 * Blog içerikleri ve tasarruf rehberleri için.
 */
async function createBlogPosts() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Blog kategorileri tablosu
    await client.query(`
      CREATE TABLE IF NOT EXISTS blog_categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL UNIQUE,
        slug VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        icon_name VARCHAR(50),
        color VARCHAR(7),
        display_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Blog posts tablosu
    await client.query(`
      CREATE TABLE IF NOT EXISTS blog_posts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        category_id UUID REFERENCES blog_categories(id) ON DELETE SET NULL,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        excerpt TEXT,
        content TEXT NOT NULL,
        featured_image_url TEXT,
        author_name VARCHAR(100) DEFAULT '1ndirim Ekibi',
        view_count INTEGER DEFAULT 0,
        is_featured BOOLEAN DEFAULT false,
        is_published BOOLEAN DEFAULT true,
        published_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_blog_posts_category_id 
      ON blog_posts(category_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_blog_posts_slug 
      ON blog_posts(slug);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_blog_posts_is_published 
      ON blog_posts(is_published);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_blog_posts_is_featured 
      ON blog_posts(is_featured);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at 
      ON blog_posts(published_at DESC);
    `);

    // Updated_at trigger
    await client.query(`
      CREATE OR REPLACE FUNCTION update_blog_posts_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS trigger_update_blog_posts_updated_at ON blog_posts;
      CREATE TRIGGER trigger_update_blog_posts_updated_at
      BEFORE UPDATE ON blog_posts
      FOR EACH ROW
      EXECUTE FUNCTION update_blog_posts_updated_at();
    `);

    // Varsayılan kategorileri ekle
    const defaultCategories = [
      {
        name: 'Kampanya İpuçları',
        slug: 'kampanya-ipuclari',
        description: 'Kampanyalardan en iyi şekilde yararlanma rehberleri',
        icon_name: 'lightbulb',
        color: '#FFC107',
        display_order: 1,
      },
      {
        name: 'Tasarruf Rehberleri',
        slug: 'tasarruf-rehberleri',
        description: 'Para tasarrufu yapmanın yolları',
        icon_name: 'savings',
        color: '#4CAF50',
        display_order: 2,
      },
      {
        name: 'Kategori Rehberleri',
        slug: 'kategori-rehberleri',
        description: 'Kategori bazlı kampanya rehberleri',
        icon_name: 'category',
        color: '#2196F3',
        display_order: 3,
      },
      {
        name: 'Kullanıcı Hikayeleri',
        slug: 'kullanici-hikayeleri',
        description: 'Kullanıcıların başarı hikayeleri',
        icon_name: 'people',
        color: '#9C27B0',
        display_order: 4,
      },
    ];

    for (const category of defaultCategories) {
      await client.query(`
        INSERT INTO blog_categories (name, slug, description, icon_name, color, display_order)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (slug) DO NOTHING
      `, [
        category.name,
        category.slug,
        category.description,
        category.icon_name,
        category.color,
        category.display_order,
      ]);
    }

    // Örnek blog yazıları ekle
    const samplePosts = [
      {
        category_slug: 'kampanya-ipuclari',
        title: 'Kampanyalardan En İyi Şekilde Yararlanma Rehberi',
        slug: 'kampanyalardan-en-iyi-sekilde-yararlanma-rehberi',
        excerpt: 'Kampanyaları takip ederek tasarruf etmenin püf noktalarını öğrenin.',
        content: `# Kampanyalardan En İyi Şekilde Yararlanma Rehberi

Kampanyalardan maksimum fayda sağlamak için dikkat etmeniz gereken birkaç önemli nokta var:

## 1. Düzenli Takip
- Kampanyaları düzenli olarak kontrol edin
- Favorilerinize ekleyerek takip edin
- Bitiş tarihlerini not alın

## 2. Fiyat Karşılaştırması
- Farklı kaynaklardaki kampanyaları karşılaştırın
- En iyi fırsatı bulmak için zaman ayırın

## 3. Hızlı Hareket
- Sınırlı süreli kampanyalarda hızlı karar verin
- Stok durumunu kontrol edin

Bu ipuçlarıyla kampanyalardan daha fazla tasarruf edebilirsiniz!`,
        is_featured: true,
      },
      {
        category_slug: 'tasarruf-rehberleri',
        title: 'Günlük Hayatta Tasarruf Etmenin 10 Yolu',
        slug: 'gunluk-hayatta-tasarruf-etmenin-10-yolu',
        excerpt: 'Küçük değişikliklerle büyük tasarruflar yapabilirsiniz.',
        content: `# Günlük Hayatta Tasarruf Etmenin 10 Yolu

Tasarruf etmek için büyük değişiklikler yapmanıza gerek yok. İşte günlük hayatta uygulayabileceğiniz basit yöntemler:

1. **Kampanyaları Takip Edin**: Düzenli olarak kampanya bildirimlerini kontrol edin
2. **Fiyat Karşılaştırması Yapın**: Alışveriş yapmadan önce farklı kaynakları karşılaştırın
3. **Favorilerinizi Kullanın**: İlgilendiğiniz kampanyaları favorilerinize ekleyin
4. **Bitiş Tarihlerini Not Alın**: Kampanyaların bitiş tarihlerini takip edin
5. **Toplu Alışveriş Yapın**: İndirimli ürünleri stoklayın
6. **Kredi Kartı Avantajlarını Kullanın**: Kartınızın sunduğu kampanyalardan yararlanın
7. **Cashback Programları**: Cashback veren kampanyaları tercih edin
8. **Sezon Sonu Alışverişi**: Sezon sonu indirimlerini kaçırmayın
9. **Bildirimleri Açın**: Yeni kampanyalardan haberdar olun
10. **Planlı Alışveriş**: İhtiyacınız olanları listeleyin ve kampanya bekleyin

Bu basit yöntemlerle aylık bütçenizde önemli tasarruflar yapabilirsiniz!`,
        is_featured: true,
      },
    ];

    for (const post of samplePosts) {
      // Kategori ID'sini bul
      const categoryResult = await client.query(
        'SELECT id FROM blog_categories WHERE slug = $1',
        [post.category_slug]
      );

      if (categoryResult.rows.length > 0) {
        const categoryId = categoryResult.rows[0].id;
        await client.query(`
          INSERT INTO blog_posts (category_id, title, slug, excerpt, content, is_featured, is_published, published_at)
          VALUES ($1, $2, $3, $4, $5, $6, true, NOW())
          ON CONFLICT (slug) DO NOTHING
        `, [
          categoryId,
          post.title,
          post.slug,
          post.excerpt,
          post.content,
          post.is_featured,
        ]);
      }
    }

    // Comment
    await client.query(`
      COMMENT ON TABLE blog_categories IS 
      'Blog kategorileri (Kampanya İpuçları, Tasarruf Rehberleri, vb.)';
    `);

    await client.query(`
      COMMENT ON TABLE blog_posts IS 
      'Blog yazıları ve içerikler';
    `);

    await client.query('COMMIT');
    console.log('✅ blog_categories ve blog_posts tabloları oluşturuldu');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration hatası:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run migration
if (require.main === module) {
  createBlogPosts()
    .then(() => {
      console.log('Migration tamamlandı');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration başarısız:', error);
      process.exit(1);
    });
}

module.exports = createBlogPosts;
