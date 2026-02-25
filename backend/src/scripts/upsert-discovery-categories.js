/**
 * Upsert discovery categories for Keşfet
 */

require('dotenv').config();
const pool = require('../config/database');

const categories = [
  {
    name: 'entertainment',
    display_name: 'Eğlence',
    icon: '🎬',
    description: 'Netflix, YouTube, biletleme ve diğer eğlence platformları',
    min_campaigns: 10,
    fixed_sources: [
      'Netflix',
      'YouTube Premium',
      'Amazon Prime',
      'Exxen',
      'Gain',
      'Tivibu',
      'TV+',
      'BluTV',
      'Mubi',
      'Passo',
      'Biletix',
      'Müzekart',
    ],
  },
  {
    name: 'gaming',
    display_name: 'Oyun',
    icon: '🎮',
    description: 'Steam, Epic Games, PlayStation ve diğer oyun platformları',
    min_campaigns: 10,
    fixed_sources: [
      'Steam',
      'Epic Games',
      'Nvidia',
      'PlayStation',
      'Xbox',
      'Game Pass',
      'EA Play',
      'Ubisoft',
    ],
  },
  {
    name: 'fashion',
    display_name: 'Giyim',
    icon: '👕',
    description: 'Zara, H&M ve diğer giyim markaları',
    min_campaigns: 10,
    fixed_sources: [
      'Zara',
      'H&M',
      'Bershka',
      'Pull&Bear',
      'LCW',
      'Koton',
      'Mavi',
      'DeFacto',
      'Collins',
      'Beymen',
    ],
  },
  {
    name: 'cosmetics',
    display_name: 'Kozmetik',
    icon: '💄',
    description: 'Sephora, Gratis ve diğer kozmetik markaları',
    min_campaigns: 10,
    fixed_sources: ['Sephora', 'Gratis', 'Watsons', 'MAC Cosmetics', 'Flormar'],
  },
  {
    name: 'travel',
    display_name: 'Seyahat',
    icon: '✈️',
    description: 'THY, Pegasus ve diğer seyahat hizmetleri',
    min_campaigns: 10,
    fixed_sources: [
      'THY',
      'Pegasus',
      'AJet',
      'Setur',
      'ETS',
      'Odamax',
      'Obilet',
      'Booking.com',
      'Hotels.com',
      'Airbnb',
      'Jolly',
      'Etstur',
    ],
  },
  {
    name: 'food',
    display_name: 'Yemek',
    icon: '🍔',
    description: 'Yemeksepeti, Getir ve diğer yemek servisleri',
    min_campaigns: 10,
    fixed_sources: [
      'Yemeksepeti',
      'Getir',
      'Migros',
      'Trendyol Yemek',
      'Banabi',
      'Dominos',
      'McDonalds',
      'Burger King',
    ],
  },
  {
    name: 'finance',
    display_name: 'Finans',
    icon: '💳',
    description: 'Papara, Tosla, bankalar ve diğer finans hizmetleri',
    min_campaigns: 10,
    fixed_sources: [
      'Papara',
      'Tosla',
      'Enpara',
      'Akbank',
      'Garanti',
      'İş Bankası',
      'Yapı Kredi',
      'QNB Finansbank',
    ],
  },
];

async function upsertCategories() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const cat of categories) {
      await client.query(
        `INSERT INTO campaign_categories
         (name, display_name, icon, description, min_campaigns, fixed_sources, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, true)
         ON CONFLICT (name)
         DO UPDATE SET
           display_name = EXCLUDED.display_name,
           icon = EXCLUDED.icon,
           description = EXCLUDED.description,
           min_campaigns = EXCLUDED.min_campaigns,
           fixed_sources = EXCLUDED.fixed_sources,
           is_active = true`,
        [
          cat.name,
          cat.display_name,
          cat.icon,
          cat.description,
          cat.min_campaigns,
          JSON.stringify(cat.fixed_sources),
        ]
      );
      console.log(`✅ Category upsert: ${cat.display_name}`);
    }

    await client.query('COMMIT');
    console.log('✅ Keşfet kategorileri güncellendi');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Category upsert error:', error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  upsertCategories()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { upsertCategories };
