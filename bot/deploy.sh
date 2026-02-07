#!/bin/bash

# Bot Deploy Script
# Bu script'i sunucuda çalıştırın: bash deploy.sh

set -e  # Hata olursa dur

echo "🤖 Bot Deploy başlatılıyor..."
echo ""

# 1. Dizin oluştur
echo "📁 Dizin oluşturuluyor..."
mkdir -p /var/www/1indirim-bot
cd /var/www/1indirim-bot

# 2. Repository clone et (veya pull)
if [ -d ".git" ]; then
    echo "📥 Repository güncelleniyor..."
    git pull
else
    echo "📥 Repository clone ediliyor..."
    git clone https://github.com/birdir1/1ndirim.git .
fi

# 3. Bot dizinine git
cd bot

# 4. Bağımlılıkları yükle
echo "📦 Bağımlılıklar yükleniyor..."
npm install

# 5. Puppeteer için gerekli sistem kütüphanelerini kur
echo "🔍 Puppeteer bağımlılıkları kontrol ediliyor..."
apt-get update -qq
apt-get install -y \
    chromium-browser \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    xdg-utils \
    libasound2 \
    libatspi2.0-0 \
    libxshmfence1

# 6. Environment variables ayarla
echo "⚙️ Environment variables ayarlanıyor..."
if [ -f ".env" ]; then
    echo "✅ .env zaten var, overwrite edilmiyor (INTERNAL_BOT_TOKEN korunur)"
else
    cat > .env << EOF
NODE_ENV=production
BACKEND_API_URL=https://api.1indirim.birdir1.com/api
INTERNAL_BOT_TOKEN=
BOT_LOCK_PATH=/tmp/1ndirim-bot.lock
BOT_LOCK_TTL_MS=7200000
BOT_BATCH_SIZE=10
BOT_BATCH_DELAY_MS=500
SCRAPER_DELAY_MS=3000
SCHEDULER_INTERVAL_MINUTES=30
EOF
    echo "⚠️ INTERNAL_BOT_TOKEN .env içinde ayarlanmadan backend'e yazma yapılamaz."
fi

# 7. Dead-letter dizini oluştur
echo "📁 Dead-letter dizini oluşturuluyor..."
mkdir -p dead-letters

# 8. PM2 ile çalıştır
echo "🚀 PM2 ile başlatılıyor..."
pm2 stop 1indirim-bot 2>/dev/null || true  # Varsa durdur
pm2 delete 1indirim-bot 2>/dev/null || true  # Varsa sil
pm2 start npm --name "1indirim-bot" -- start
pm2 save

echo ""
echo "✅ Bot deploy tamamlandı!"
echo ""
echo "📊 PM2 durumu:"
pm2 list | grep 1indirim-bot
echo ""
echo "📝 Logları görmek için: pm2 logs 1indirim-bot"
echo "🔄 Bot her 30 dakikada bir otomatik olarak çalışacak"
echo ""
echo "⚠️ NOT: Bot ilk çalıştırmada tüm kaynakları scrape edecek."
echo "   Bu işlem birkaç dakika sürebilir."
