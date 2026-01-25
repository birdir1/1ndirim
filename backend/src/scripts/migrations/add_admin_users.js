/**
 * FAZ 10: Admin Users Table Migration
 * 
 * Admin authorization için admin_users tablosu
 * - id, email, role, is_active, created_at
 * - Role ENUM: super_admin, editor, viewer
 */

const pool = require('../../config/database');

async function addAdminUsers() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🔧 FAZ 10: Admin Users migration başlatılıyor...');
    
    // 1. Admin role ENUM oluştur
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE admin_role_enum AS ENUM ('super_admin', 'editor', 'viewer');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    console.log('✅ Admin role ENUM oluşturuldu');
    
    // 2. Admin users tablosu
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        role admin_role_enum NOT NULL DEFAULT 'viewer',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    console.log('✅ Admin users tablosu oluşturuldu');
    
    // 3. Index'ler
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
      CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
      CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON admin_users(is_active) WHERE is_active = true;
    `);
    
    console.log('✅ Admin users index\'leri oluşturuldu');
    
    // 4. Updated_at trigger (opsiyonel, best practice)
    await client.query(`
      CREATE OR REPLACE FUNCTION update_admin_users_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    await client.query(`
      DROP TRIGGER IF EXISTS trigger_update_admin_users_updated_at ON admin_users;
      CREATE TRIGGER trigger_update_admin_users_updated_at
        BEFORE UPDATE ON admin_users
        FOR EACH ROW
        EXECUTE FUNCTION update_admin_users_updated_at();
    `);
    
    console.log('✅ Updated_at trigger oluşturuldu');
    
    await client.query('COMMIT');
    console.log('✅ FAZ 10: Admin Users migration tamamlandı');
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
  addAdminUsers()
    .then(() => {
      console.log('✅ Migration başarılı');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration başarısız:', error);
      process.exit(1);
    });
}

module.exports = addAdminUsers;
