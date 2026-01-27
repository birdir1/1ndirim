#!/bin/bash

# Admin Panel Deploy Script
# Bu script'i sunucuda çalıştırın: bash deploy.sh

set -e  # Hata olursa dur

echo "🚀 Admin Panel Deploy başlatılıyor..."
echo ""

# 1. Dizin oluştur
echo "📁 Dizin oluşturuluyor..."
mkdir -p /var/www/1indirim-admin
cd /var/www/1indirim-admin

# 2. Repository clone et (veya pull)
if [ -d ".git" ]; then
    echo "📥 Repository güncelleniyor..."
    git pull
else
    echo "📥 Repository clone ediliyor..."
    git clone https://github.com/birdir1/1ndirim.git .
fi

# 3. Admin panel dizinine git
cd admin-panel

# 4. Bağımlılıkları yükle
echo "📦 Bağımlılıklar yükleniyor..."
npm install

# 5. Environment variables ayarla
echo "⚙️ Environment variables ayarlanıyor..."
cat > .env.production << EOF
NEXT_PUBLIC_BACKEND_BASE_URL=https://api.1indirim.birdir1.com
NODE_ENV=production
PORT=3002
EOF

# 6. Build et
echo "🔨 Build ediliyor..."
npm run build

# 7. PM2 ile çalıştır
echo "🚀 PM2 ile başlatılıyor..."
pm2 stop 1indirim-admin 2>/dev/null || true  # Varsa durdur
pm2 delete 1indirim-admin 2>/dev/null || true  # Varsa sil
pm2 start npm --name "1indirim-admin" -- start
pm2 save

echo ""
echo "✅ Admin Panel deploy tamamlandı!"
echo ""
echo "📊 PM2 durumu:"
pm2 list | grep 1indirim-admin
echo ""
echo "🌐 Admin panel şu adresten erişilebilir:"
echo "   https://admin.1indirim.birdir1.com"
echo ""
echo "🔑 Giriş bilgileri:"
echo "   Email: umitgulcuk680@gmail.com"
echo "   API Key: fbd93e60567c0c118e990471b8f700a67d25d2a207720aa435f3856e5fcb5d26"
echo ""
echo "📝 Logları görmek için: pm2 logs 1indirim-admin"
