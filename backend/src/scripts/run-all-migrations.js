/**
 * Tüm migration'ları sırayla çalıştırır
 * README.md'deki sıraya göre çalıştırılır
 */

require('dotenv').config();
const { execSync } = require('child_process');
const path = require('path');

const migrationsDir = path.join(__dirname, 'migrations');

const migrations = [
  '000_init_core_schema.js',
  'add_admin_users.js',
  'add_light_campaign_mode.js',
  'add_category_campaign_mode.js',
  'add_low_value_campaign_mode.js',
  'add_hidden_campaign_type.js',
  'add_affiliate_url.js',
  'add_admin_control_layer.js',
  'add_admin_overrides.js',
  'enhance_audit_logs.js',
  'add_source_status.js',
  'create_campaign_clicks.js',
  'add_admin_suggestions.js',
  'add_admin_suggestions_execution.js',
];

console.log('🚀 Migration\'lar başlatılıyor...\n');
console.log(`📁 Migration dizini: ${migrationsDir}\n`);

let successCount = 0;
let failCount = 0;

for (let i = 0; i < migrations.length; i++) {
  const migration = migrations[i];
  const migrationPath = path.join(migrationsDir, migration);
  
  console.log(`[${i + 1}/${migrations.length}] Çalıştırılıyor: ${migration}`);
  
  try {
    execSync(`node "${migrationPath}"`, {
      stdio: 'inherit',
      cwd: path.join(__dirname, '../../'),
      env: process.env,
    });
    console.log(`✅ ${migration} başarılı\n`);
    successCount++;
  } catch (error) {
    console.error(`❌ ${migration} başarısız:`, error.message);
    console.error(`\n⚠️ Migration durduruldu. Lütfen hatayı kontrol edin.\n`);
    failCount++;
    process.exit(1);
  }
}

console.log('\n' + '='.repeat(60));
console.log(`✅ Toplam ${successCount} migration başarıyla çalıştırıldı`);
if (failCount > 0) {
  console.log(`❌ ${failCount} migration başarısız oldu`);
}
console.log('='.repeat(60) + '\n');
