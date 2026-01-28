const pool = require('../../config/database');

/**
 * Migration: user_badges tablosu.
 * REQUIRES: user_points table.
 * 
 * Kullanıcı rozetlerini saklar. Belirli koşullar sağlandığında rozet kazanılır.
 */
async function createUserBadges() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Badge definitions tablosu (rozet tanımları)
    await client.query(`
      CREATE TABLE IF NOT EXISTS badge_definitions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        badge_key VARCHAR(100) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        icon_name VARCHAR(100), -- Material icon name
        icon_color VARCHAR(7), -- Hex color
        requirement_type VARCHAR(50) NOT NULL, -- 'points', 'favorites', 'comments', 'ratings', 'streak', etc.
        requirement_value INTEGER NOT NULL,
        rarity VARCHAR(20) DEFAULT 'common', -- 'common', 'rare', 'epic', 'legendary'
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_badge_definitions_key 
      ON badge_definitions(badge_key);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_badge_definitions_rarity 
      ON badge_definitions(rarity);
    `);

    // user_badges tablosu (kullanıcıların kazandığı rozetler)
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_badges (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) NOT NULL,
        badge_id UUID NOT NULL REFERENCES badge_definitions(id) ON DELETE CASCADE,
        earned_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, badge_id)
      );
    `);

    // Indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_badges_user_id 
      ON user_badges(user_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id 
      ON user_badges(badge_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_badges_earned_at 
      ON user_badges(earned_at DESC);
    `);

    // Varsayılan rozetleri ekle
    const defaultBadges = [
      {
        badge_key: 'first_favorite',
        name: 'İlk Favori',
        description: 'İlk favori kampanyanı ekledin',
        icon_name: 'favorite',
        icon_color: '#E91E63',
        requirement_type: 'favorites',
        requirement_value: 1,
        rarity: 'common',
      },
      {
        badge_key: 'favorite_collector_10',
        name: 'Favori Toplayıcı',
        description: '10 favori kampanya ekledin',
        icon_name: 'favorite_border',
        icon_color: '#E91E63',
        requirement_type: 'favorites',
        requirement_value: 10,
        rarity: 'rare',
      },
      {
        badge_key: 'favorite_collector_50',
        name: 'Favori Ustası',
        description: '50 favori kampanya ekledin',
        icon_name: 'favorite',
        icon_color: '#C2185B',
        requirement_type: 'favorites',
        requirement_value: 50,
        rarity: 'epic',
      },
      {
        badge_key: 'first_comment',
        name: 'İlk Yorum',
        description: 'İlk yorumunu yaptın',
        icon_name: 'comment',
        icon_color: '#2196F3',
        requirement_type: 'comments',
        requirement_value: 1,
        rarity: 'common',
      },
      {
        badge_key: 'commentator_10',
        name: 'Yorumcu',
        description: '10 yorum yaptın',
        icon_name: 'comment',
        icon_color: '#2196F3',
        requirement_type: 'comments',
        requirement_value: 10,
        rarity: 'rare',
      },
      {
        badge_key: 'first_rating',
        name: 'İlk Puan',
        description: 'İlk puanını verdin',
        icon_name: 'star',
        icon_color: '#FFC107',
        requirement_type: 'ratings',
        requirement_value: 1,
        rarity: 'common',
      },
      {
        badge_key: 'rater_10',
        name: 'Puanlayıcı',
        description: '10 kampanyaya puan verdin',
        icon_name: 'star',
        icon_color: '#FFC107',
        requirement_type: 'ratings',
        requirement_value: 10,
        rarity: 'rare',
      },
      {
        badge_key: 'points_100',
        name: 'Başlangıç',
        description: '100 puan kazandın',
        icon_name: 'emoji_events',
        icon_color: '#9E9E9E',
        requirement_type: 'points',
        requirement_value: 100,
        rarity: 'common',
      },
      {
        badge_key: 'points_500',
        name: 'Deneyimli',
        description: '500 puan kazandın',
        icon_name: 'emoji_events',
        icon_color: '#FF9800',
        requirement_type: 'points',
        requirement_value: 500,
        rarity: 'rare',
      },
      {
        badge_key: 'points_1000',
        name: 'Usta',
        description: '1000 puan kazandın',
        icon_name: 'emoji_events',
        icon_color: '#9C27B0',
        requirement_type: 'points',
        requirement_value: 1000,
        rarity: 'epic',
      },
      {
        badge_key: 'points_5000',
        name: 'Efsane',
        description: '5000 puan kazandın',
        icon_name: 'emoji_events',
        icon_color: '#FF5722',
        requirement_type: 'points',
        requirement_value: 5000,
        rarity: 'legendary',
      },
    ];

    for (const badge of defaultBadges) {
      await client.query(`
        INSERT INTO badge_definitions (badge_key, name, description, icon_name, icon_color, requirement_type, requirement_value, rarity)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (badge_key) DO NOTHING
      `, [
        badge.badge_key,
        badge.name,
        badge.description,
        badge.icon_name,
        badge.icon_color,
        badge.requirement_type,
        badge.requirement_value,
        badge.rarity,
      ]);
    }

    // Comment
    await client.query(`
      COMMENT ON TABLE badge_definitions IS 
      'Rozet tanımları. Hangi koşullarda hangi rozetlerin kazanılacağını belirler.';
    `);

    await client.query(`
      COMMENT ON TABLE user_badges IS 
      'Kullanıcıların kazandığı rozetler. Firebase UID ile kullanıcıları tanımlar.';
    `);

    await client.query('COMMIT');
    console.log('✅ user_badges ve badge_definitions tabloları oluşturuldu');
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
  createUserBadges()
    .then(() => {
      console.log('Migration tamamlandı');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration başarısız:', error);
      process.exit(1);
    });
}

module.exports = createUserBadges;
