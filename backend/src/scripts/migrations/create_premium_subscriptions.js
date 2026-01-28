const pool = require('../../config/database');

/**
 * Migration: Premium üyelik sistemi tabloları.
 * Kullanıcılar premium üye olup özel avantajlardan yararlanabilir.
 */
async function createPremiumSubscriptions() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Premium abonelikler tablosu
    await client.query(`
      CREATE TABLE IF NOT EXISTS premium_subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) NOT NULL UNIQUE,
        plan_type VARCHAR(50) DEFAULT 'monthly',
        status VARCHAR(20) DEFAULT 'active',
        started_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP,
        auto_renew BOOLEAN DEFAULT true,
        payment_provider VARCHAR(50),
        payment_transaction_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(firebase_uid) ON DELETE CASCADE
      );
    `);

    // Premium özellikler tablosu
    await client.query(`
      CREATE TABLE IF NOT EXISTS premium_features (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        feature_key VARCHAR(100) NOT NULL UNIQUE,
        feature_name VARCHAR(255) NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Premium planlar tablosu
    await client.query(`
      CREATE TABLE IF NOT EXISTS premium_plans (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        plan_key VARCHAR(50) NOT NULL UNIQUE,
        plan_name VARCHAR(255) NOT NULL,
        description TEXT,
        price_monthly DECIMAL(10, 2),
        price_yearly DECIMAL(10, 2),
        currency VARCHAR(10) DEFAULT 'TRY',
        features JSONB,
        is_active BOOLEAN DEFAULT true,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_premium_subscriptions_user_id 
      ON premium_subscriptions(user_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_premium_subscriptions_status 
      ON premium_subscriptions(status);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_premium_subscriptions_expires_at 
      ON premium_subscriptions(expires_at);
    `);

    // Updated_at trigger
    await client.query(`
      CREATE OR REPLACE FUNCTION update_premium_subscriptions_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS trigger_update_premium_subscriptions_updated_at ON premium_subscriptions;
      CREATE TRIGGER trigger_update_premium_subscriptions_updated_at
      BEFORE UPDATE ON premium_subscriptions
      FOR EACH ROW
      EXECUTE FUNCTION update_premium_subscriptions_updated_at();
    `);

    // Varsayılan premium özellikler
    const defaultFeatures = [
      {
        feature_key: 'ad_free',
        feature_name: 'Reklamsız Deneyim',
        description: 'Uygulamada reklam görmezsiniz',
      },
      {
        feature_key: 'unlimited_favorites',
        feature_name: 'Sınırsız Favori',
        description: 'Sınırsız sayıda kampanyayı favorilerinize ekleyebilirsiniz',
      },
      {
        feature_key: 'priority_support',
        feature_name: 'Öncelikli Destek',
        description: 'Destek talepleriniz öncelikli olarak yanıtlanır',
      },
      {
        feature_key: 'advanced_filters',
        feature_name: 'Gelişmiş Filtreler',
        description: 'Daha detaylı filtreleme seçenekleri',
      },
      {
        feature_key: 'price_alerts',
        feature_name: 'Fiyat Uyarıları',
        description: 'İstediğiniz fiyata düştüğünde bildirim alın',
      },
      {
        feature_key: 'export_data',
        feature_name: 'Veri Dışa Aktarma',
        description: 'Favorilerinizi ve verilerinizi dışa aktarın',
      },
    ];

    for (const feature of defaultFeatures) {
      await client.query(`
        INSERT INTO premium_features (feature_key, feature_name, description, is_active)
        VALUES ($1, $2, $3, true)
        ON CONFLICT (feature_key) DO NOTHING
      `, [feature.feature_key, feature.feature_name, feature.description]);
    }

    // Varsayılan premium planlar
    const defaultPlans = [
      {
        plan_key: 'monthly',
        plan_name: 'Aylık Premium',
        description: 'Aylık premium üyelik',
        price_monthly: 29.99,
        price_yearly: null,
        currency: 'TRY',
        features: JSON.stringify([
          'ad_free',
          'unlimited_favorites',
          'priority_support',
          'advanced_filters',
          'price_alerts',
        ]),
        display_order: 1,
      },
      {
        plan_key: 'yearly',
        plan_name: 'Yıllık Premium',
        description: 'Yıllık premium üyelik (2 ay bedava)',
        price_monthly: null,
        price_yearly: 299.99,
        currency: 'TRY',
        features: JSON.stringify([
          'ad_free',
          'unlimited_favorites',
          'priority_support',
          'advanced_filters',
          'price_alerts',
          'export_data',
        ]),
        display_order: 2,
      },
    ];

    for (const plan of defaultPlans) {
      await client.query(`
        INSERT INTO premium_plans (
          plan_key, plan_name, description, 
          price_monthly, price_yearly, currency, 
          features, is_active, display_order
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, true, $8)
        ON CONFLICT (plan_key) DO NOTHING
      `, [
        plan.plan_key,
        plan.plan_name,
        plan.description,
        plan.price_monthly,
        plan.price_yearly,
        plan.currency,
        plan.features,
        plan.display_order,
      ]);
    }

    // Comment
    await client.query(`
      COMMENT ON TABLE premium_subscriptions IS 
      'Kullanıcıların premium abonelikleri';
    `);

    await client.query(`
      COMMENT ON TABLE premium_features IS 
      'Premium üyelik özellikleri';
    `);

    await client.query(`
      COMMENT ON TABLE premium_plans IS 
      'Premium üyelik planları';
    `);

    await client.query('COMMIT');
    console.log('✅ Premium üyelik sistemi tabloları oluşturuldu');
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
  createPremiumSubscriptions()
    .then(() => {
      console.log('Migration tamamlandı');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration başarısız:', error);
      process.exit(1);
    });
}

module.exports = createPremiumSubscriptions;
