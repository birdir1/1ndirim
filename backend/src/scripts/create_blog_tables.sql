-- ============================================
-- BLOG TABLES SCHEMA
-- ============================================

-- Blog Categories Table
CREATE TABLE IF NOT EXISTS blog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(20),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Blog Posts Table
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES blog_categories(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL,
  featured_image_url TEXT,
  author_name VARCHAR(100),
  author_avatar_url TEXT,
  read_time_minutes INTEGER,
  is_featured BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Blog Tags Table (optional, for future)
CREATE TABLE IF NOT EXISTS blog_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  slug VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Blog Post Tags Junction Table (optional, for future)
CREATE TABLE IF NOT EXISTS blog_post_tags (
  post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES blog_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_blog_posts_category_id ON blog_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_featured ON blog_posts(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_blog_categories_slug ON blog_categories(slug);
CREATE INDEX IF NOT EXISTS idx_blog_categories_active ON blog_categories(is_active) WHERE is_active = true;

-- Sample Data
INSERT INTO blog_categories (name, slug, description, icon, color, display_order) VALUES
  ('Tasarruf İpuçları', 'tasarruf-ipuclari', 'Günlük hayatta tasarruf yapmanın yolları', 'savings', '#10B981', 1),
  ('Kampanya Rehberi', 'kampanya-rehberi', 'Kampanyalardan en iyi şekilde nasıl yararlanılır', 'campaign', '#3B82F6', 2),
  ('Finans', 'finans', 'Kişisel finans ve bütçe yönetimi', 'attach_money', '#F59E0B', 3),
  ('Alışveriş', 'alisveris', 'Akıllı alışveriş teknikleri', 'shopping_cart', '#EC4899', 4),
  ('Teknoloji', 'teknoloji', 'Teknoloji ürünlerinde fırsatlar', 'devices', '#8B5CF6', 5)
ON CONFLICT (slug) DO NOTHING;

-- Sample Blog Posts
INSERT INTO blog_posts (
  category_id,
  title,
  slug,
  excerpt,
  content,
  featured_image_url,
  author_name,
  read_time_minutes,
  is_featured,
  is_published,
  published_at
) VALUES
  (
    (SELECT id FROM blog_categories WHERE slug = 'tasarruf-ipuclari'),
    '2026 Yılında Tasarruf Yapmanın 10 Yolu',
    '2026-yilinda-tasarruf-yapmanin-10-yolu',
    'Yeni yılda bütçenizi kontrol altına almanın en etkili yollarını keşfedin.',
    '<h2>Giriş</h2><p>2026 yılında tasarruf yapmak için en etkili stratejileri sizler için derledik...</p>',
    'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e',
    '1ndirim Editör',
    5,
    true,
    true,
    NOW()
  ),
  (
    (SELECT id FROM blog_categories WHERE slug = 'kampanya-rehberi'),
    'Banka Kampanyalarından Maksimum Fayda Nasıl Sağlanır?',
    'banka-kampanyalarindan-maksimum-fayda',
    'Banka kampanyalarını doğru kullanarak yıllık binlerce lira tasarruf edebilirsiniz.',
    '<h2>Banka Kampanyaları</h2><p>Bankalar sürekli olarak müşterilerine çeşitli kampanyalar sunuyor...</p>',
    'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d',
    '1ndirim Editör',
    7,
    true,
    true,
    NOW()
  ),
  (
    (SELECT id FROM blog_categories WHERE slug = 'finans'),
    'Kişisel Bütçe Nasıl Oluşturulur?',
    'kisisel-butce-nasil-olusturulur',
    'Finansal hedeflerinize ulaşmak için etkili bir bütçe oluşturma rehberi.',
    '<h2>Bütçe Oluşturma</h2><p>Kişisel bütçe oluşturmak finansal özgürlüğe giden ilk adımdır...</p>',
    'https://images.unsplash.com/photo-1554224155-6726b3ff858f',
    '1ndirim Editör',
    6,
    false,
    true,
    NOW()
  )
ON CONFLICT (slug) DO NOTHING;

-- Update timestamps trigger
CREATE OR REPLACE FUNCTION update_blog_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER blog_categories_updated_at
  BEFORE UPDATE ON blog_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_updated_at();

CREATE TRIGGER blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_updated_at();
