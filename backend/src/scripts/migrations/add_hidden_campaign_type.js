/**
 * FAZ 10: Hidden Campaign Type Migration
 * 
 * Admin override için 'hidden' campaign_type değeri
 * - campaign_type_enum'a 'hidden' ekle
 */

const pool = require('../../config/database');

async function addHiddenCampaignType() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🔧 FAZ 10: Hidden campaign type migration başlatılıyor...');
    
    // campaign_type_enum'a 'hidden' değerini ekle
    try {
      await client.query(`ALTER TYPE campaign_type_enum ADD VALUE 'hidden'`);
      console.log('✅ campaign_type_enum\'a \'hidden\' değeri eklendi');
    } catch (error) {
      // 'hidden' değeri zaten varsa veya başka bir hata varsa ignore et
      if (error.message.includes('already exists')) {
        console.log('ℹ️  \'hidden\' değeri zaten mevcut');
      } else {
        console.warn('⚠️ campaign_type_enum\'a \'hidden\' değeri eklenirken uyarı:', error.message);
      }
    }
    
    await client.query('COMMIT');
    console.log('✅ FAZ 10: Hidden campaign type migration tamamlandı');
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
  addHiddenCampaignType()
    .then(() => {
      console.log('✅ Migration başarılı');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration başarısız:', error);
      process.exit(1);
    });
}

module.exports = addHiddenCampaignType;
