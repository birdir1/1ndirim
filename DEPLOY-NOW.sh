#!/bin/bash
# 🚀 PRODUCTION DEPLOYMENT SCRIPT
# Run this on your production server (37.140.242.105)

set -e  # Exit on error

echo "🚀 Starting deployment..."

# Step 1: Navigate to project directory
echo "📁 Finding project directory..."
cd /root/1ndirim || cd /home/ubuntu/1ndirim || cd /var/www/1ndirim || {
    echo "❌ Project directory not found. Please update the path."
    exit 1
}

echo "✅ Found project at: $(pwd)"

# Step 2: Pull latest code
echo "📥 Pulling latest code from GitHub..."
git pull origin main

# Step 3: Run database migration
echo "🗄️  Running database migration..."
cd backend

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found in backend/"
    exit 1
fi

# Load database credentials from .env
source .env

# Run migration
PGPASSWORD=$DB_PASSWORD psql -U $DB_USER -d $DB_NAME -h ${DB_HOST:-localhost} \
    -f migrations/003_enhance_campaign_source_models.sql

echo "✅ Migration complete"

# Step 4: Install dependencies (if needed)
echo "📦 Checking dependencies..."
npm install --production

# Step 5: Restart backend
echo "🔄 Restarting backend..."
if command -v pm2 &> /dev/null; then
    pm2 restart 1ndirim-api || pm2 restart all
    echo "✅ Backend restarted with PM2"
elif systemctl is-active --quiet 1ndirim-backend; then
    sudo systemctl restart 1ndirim-backend
    echo "✅ Backend restarted with systemd"
else
    echo "⚠️  Could not detect process manager. Please restart backend manually."
fi

# Step 6: Verify deployment
echo "🔍 Verifying deployment..."
sleep 3

# Test health endpoint
if curl -f -s https://api.1indirim.birdir1.com/api/health > /dev/null; then
    echo "✅ Backend health check passed"
else
    echo "⚠️  Backend health check failed"
fi

# Test dashboard endpoint
if curl -f -s https://api.1indirim.birdir1.com/api/dashboard/stats > /dev/null; then
    echo "✅ Dashboard API working"
else
    echo "⚠️  Dashboard API not responding (may need backend restart)"
fi

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Test dashboard: curl https://api.1indirim.birdir1.com/api/dashboard/stats | jq"
echo "2. Run Phase 1 test: cd bot && node run-phase1-only.js"
echo "3. Check admin dashboard: https://admin.1indirim.birdir1.com/dashboard"
