# 🚀 DEPLOYMENT GUIDE - Phase 1

**Date:** 31 Ocak 2026  
**Target:** Production server (37.140.242.105)  
**Goal:** Deploy Phase 1 changes and run runtime test

---

## 📋 PRE-DEPLOYMENT CHECKLIST

### Local Changes to Deploy:
- ✅ Phase 1 integration (12 scrapers)
- ✅ Backend enhancement (dashboard API)
- ✅ Database migration (003_enhance_campaign_source_models.sql)
- ✅ Test scripts (run-phase1-only.js)

### Git Status:
```bash
git status
git log --oneline -10
```

**Latest commits:**
- `3fe4781` - test: complete integration and backend testing
- `4005045` - docs: integration + backend enhancement complete summary
- `5fc2860` - feat(backend): enhance campaign ingestion system
- `c9a6a22` - fix(bot): integrate Phase 1 scrapers into scheduler

---

## 🔄 DEPLOYMENT STEPS

### Step 1: Push to GitHub
```bash
cd 1ndirim
git push origin main
```

### Step 2: SSH to Server
```bash
ssh root@37.140.242.105
# or
ssh ubuntu@37.140.242.105
```

### Step 3: Pull Latest Changes
```bash
cd /path/to/1ndirim  # Find the actual path
git pull origin main
```

### Step 4: Backend Deployment

#### 4.1: Run Database Migration
```bash
cd backend
PGPASSWORD=your_password psql -U your_user -d indirim_db \
  -f migrations/003_enhance_campaign_source_models.sql
```

#### 4.2: Install Dependencies (if needed)
```bash
npm install
```

#### 4.3: Restart Backend
```bash
# If using PM2:
pm2 restart 1ndirim-api

# If using systemd:
sudo systemctl restart 1ndirim-backend

# Or manual:
npm start
```

#### 4.4: Verify Backend
```bash
curl https://api.1indirim.birdir1.com/api/health
curl https://api.1indirim.birdir1.com/api/dashboard/stats
```

### Step 5: Bot Deployment

#### 5.1: Install Dependencies (if needed)
```bash
cd bot
npm install
```

#### 5.2: Run Phase 1 Test
```bash
# One-time test run:
node run-phase1-only.js

# Or add to PM2:
pm2 start run-phase1-only.js --name "phase1-test"
pm2 logs phase1-test
```

#### 5.3: Monitor Progress
```bash
# Watch logs:
pm2 logs phase1-test --lines 100

# Or tail the output:
tail -f /path/to/logs/phase1-test.log
```

---

## 📊 POST-DEPLOYMENT VERIFICATION

### 1. Check Backend Health
```bash
curl https://api.1indirim.birdir1.com/api/health | jq '.'
```

**Expected:**
```json
{
  "success": true,
  "status": "healthy",
  "checks": {
    "database": { "status": "connected" }
  }
}
```

### 2. Check Dashboard Stats
```bash
curl https://api.1indirim.birdir1.com/api/dashboard/stats | jq '.'
```

**Expected:**
```json
{
  "success": true,
  "data": {
    "totalCampaigns": 200+,
    "activeCampaigns": 180+,
    "activeSources": 12+,
    ...
  }
}
```

### 3. Check Admin Dashboard
Open: https://admin.1indirim.birdir1.com/dashboard

**Verify:**
- Dashboard loads
- Stats display correctly
- Campaign count shows Phase 1 results

### 4. Check Campaign Count by Source
```bash
curl https://api.1indirim.birdir1.com/api/dashboard/sources | jq '.data[] | {name, activeCampaigns}'
```

**Expected:** Each Phase 1 source should have 5-20 campaigns

---

## 🐛 TROUBLESHOOTING

### Issue: Migration Fails
**Solution:**
```bash
# Check if columns already exist:
psql -U user -d indirim_db -c "\d campaigns"
psql -U user -d indirim_db -c "\d sources"

# If columns exist, migration is already applied
```

### Issue: Backend Won't Start
**Solution:**
```bash
# Check logs:
pm2 logs 1ndirim-api --lines 50

# Check dependencies:
cd backend && npm install

# Check .env file:
cat .env
```

### Issue: Bot Fails to Scrape
**Solution:**
```bash
# Check network access:
curl -I https://www.isbank.com.tr

# Check browser dependencies:
sudo apt-get install -y chromium-browser

# Check logs:
pm2 logs phase1-test --lines 100
```

### Issue: No Campaigns Collected
**Possible Causes:**
1. Network firewall blocking scraper
2. Sites detecting bot traffic
3. Scraper selectors outdated
4. Rate limiting

**Solution:**
```bash
# Test single scraper:
node test-single-scraper.js

# Check if sites are accessible:
curl -I https://www.isbank.com.tr/kampanyalar
```

---

## 📈 SUCCESS CRITERIA

### Phase 1 Test Passes If:
- ✅ Backend deployed successfully
- ✅ Migration applied without errors
- ✅ Dashboard API returns data
- ✅ Bot runs without crashes
- ✅ **≥ 200 campaigns collected**
- ✅ ≥ 8/12 sources successful
- ✅ Duplicate rate < 5%
- ✅ All campaigns have finance category

### If Test Fails:
1. Check error logs
2. Identify failing sources
3. Fix scraper issues
4. Re-run test
5. Report results

---

## 🔐 SECURITY NOTES

### Environment Variables:
Ensure `.env` files are configured on server:

**Backend (.env):**
```env
PORT=3000
NODE_ENV=production
DB_HOST=localhost
DB_PORT=5432
DB_NAME=indirim_db
DB_USER=your_user
DB_PASSWORD=your_password
API_BASE_URL=https://api.1indirim.birdir1.com
```

**Bot (.env):**
```env
API_BASE_URL=https://api.1indirim.birdir1.com
OPENAI_API_KEY=your_key
SCRAPER_DELAY_MS=3000
```

### Firewall:
Ensure ports are open:
- 3000 (backend API)
- 5432 (PostgreSQL - localhost only)
- 80/443 (nginx reverse proxy)

---

## 📞 SUPPORT

If deployment fails, check:
1. Server logs: `pm2 logs`
2. System logs: `journalctl -u 1ndirim-backend`
3. Database logs: `tail -f /var/log/postgresql/postgresql.log`
4. Nginx logs: `tail -f /var/log/nginx/error.log`

---

**Deployment prepared by:** Kiro AI  
**Date:** 31 Ocak 2026  
**Status:** Ready for production deployment
