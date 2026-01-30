module.exports = {
  apps: [
    {
      name: '1ndirim-api',
      script: './src/server.js',
      instances: 'max', // Cluster mode: tüm CPU core'ları kullan
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      // Monitoring
      max_memory_restart: '500M', // 500MB'ı aşarsa restart
      min_uptime: '10s', // Minimum uptime (crash loop önleme)
      max_restarts: 10, // Maximum restart sayısı
      autorestart: true, // Otomatik restart
      watch: false, // File watching (production'da kapalı)
      ignore_watch: ['node_modules', 'logs', 'backups'],
      
      // Logging
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Advanced
      kill_timeout: 5000, // Graceful shutdown timeout
      listen_timeout: 3000, // App başlama timeout
      shutdown_with_message: true,
    },
    {
      name: '1ndirim-backup',
      script: './src/scripts/backup.js',
      instances: 1,
      exec_mode: 'fork',
      cron_restart: '0 2 * * *', // Her gün saat 02:00'de çalıştır
      autorestart: false, // Cron job olduğu için otomatik restart kapalı
      watch: false,
      
      // Logging
      error_file: './logs/backup-error.log',
      out_file: './logs/backup-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
