# ⚡ QUICK DEPLOYMENT GUIDE

## 🎯 What Was Done

**Phase 1 Integration:**
- ✅ 12 finance scrapers integrated (8 banks + 4 wallets)
- ✅ Expected: 200+ campaigns

**Backend Enhancement:**
- ✅ Dashboard API created (`/api/dashboard/stats`, `/api/dashboard/sources`)
- ✅ Campaign model enhanced (priority_score, discount_type, discount_value)
- ✅ Source model enhanced (source_type, auto-calculated campaign_count)
- ✅ Database migration ready

**Status:**
- ✅ All code committed and pushed to GitHub
- ⏳ Not yet deployed to production

---

## 🚀 Deploy to Production (3 Options)

### Option 1: Automated Script (Recommended)
```bash
# SSH to server
ssh <deploy-user>@<server-host>

# Download and run deployment script
cd /root/1ndirim  # or wherever project is located
git pull origin main
bash DEPLOY-NOW.sh
```

### Option 2: Manual Commands
```bash
# SSH to server
ssh <deploy-user>@<server-host>

# Navigate to project
cd /root/1ndirim  # adjust path if needed

# Pull latest code
git pull origin main

# Run migration
cd backend
source .env
PGPASSWORD=$DB_PASSWORD psql -U $DB_USER -d $DB_NAME \
  -f migrations/003_enhance_campaign_source_models.sql

# Restart backend
pm2 restart 1ndirim-api
# or: sudo systemctl restart 1ndirim-backend

# Verify
curl https://api.1ndirim.birdir1.com/api/dashboard/stats
```

### Option 3: Step-by-Step (Safest)
```bash
# 1. SSH
ssh <deploy-user>@<server-host>

# 2. Find project
find / -name "1ndirim" -type d 2>/dev/null

# 3. Navigate
cd /path/to/1ndirim

# 4. Check current status
git status
git log --oneline -5

# 5. Pull code
git pull origin main

# 6. Check .env
cd backend && cat .env

# 7. Run migration
PGPASSWORD=your_password psql -U your_user -d indirim_db \
  -f migrations/003_enhance_campaign_source_models.sql

# 8. Check process manager
pm2 list
# or: systemctl status 1ndirim-backend

# 9. Restart
pm2 restart 1ndirim-api
# or: sudo systemctl restart 1ndirim-backend

# 10. Verify
curl https://api.1ndirim.birdir1.com/api/health
curl https://api.1ndirim.birdir1.com/api/dashboard/stats | jq
```

---

## ✅ Verify Deployment

### 1. Check Backend Health
```bash
curl https://api.1ndirim.birdir1.com/api/health
```

**Expected:** `{"success": true, "status": "healthy"}`

### 2. Check Dashboard Stats
```bash
curl https://api.1ndirim.birdir1.com/api/dashboard/stats | jq
```

**Expected:** JSON with campaign statistics

### 3. Check Dashboard Sources
```bash
curl https://api.1ndirim.birdir1.com/api/dashboard/sources | jq
```

**Expected:** Array of sources with campaign counts

### 4. Check Admin Dashboard
Open: https://admin.1ndirim.birdir1.com/dashboard

**Expected:** Dashboard loads (may need UI update to show new metrics)

---

## 🧪 Run Phase 1 Test

After deployment, test the scrapers:

```bash
# SSH to server
ssh <deploy-user>@<server-host>

# Navigate to bot directory
cd /root/1ndirim/bot  # adjust path

# Install dependencies (if needed)
npm install

# Run Phase 1 test
node run-phase1-only.js

# Or with PM2 for monitoring
pm2 start run-phase1-only.js --name "phase1-test"
pm2 logs phase1-test
```

**Expected Results:**
- 200+ campaigns collected
- 8-12 sources successful
- All campaigns have finance category
- Sub-categories detected (food, travel, fuel, etc.)

---

## 🎯 Success Criteria

**Deployment Successful:**
- ✅ Backend restarts without errors
- ✅ Dashboard API endpoints respond
- ✅ Migration completes without errors
- ✅ No 404 errors on `/api/dashboard/*`

**Phase 1 Test Successful:**
- ✅ ≥ 200 campaigns collected
- ✅ ≥ 8/12 sources successful
- ✅ All campaigns have finance category
- ✅ Duplicate rate < 5%

---

## 🆘 Troubleshooting

### Backend won't start
```bash
pm2 logs 1ndirim-api --lines 50
# Check for errors in logs
```

### Migration fails
```bash
# Check if already applied
psql -U user -d indirim_db -c "\d campaigns"
# Look for: priority_score, discount_type, discount_value columns
```

### Dashboard returns 404
```bash
# Verify route is registered
grep -r "dashboard" backend/src/server.js
# Should see: app.use('/api/dashboard', dashboardRoutes);

# Restart backend
pm2 restart 1ndirim-api
```

### Scrapers fail
```bash
# Check network access
curl -I https://www.isbank.com.tr

# Check browser dependencies
which chromium-browser
# If missing: sudo apt-get install -y chromium-browser
```

---

## 📊 What to Expect

### After Deployment:
- Dashboard API endpoints working
- Database has new columns
- Backend running with new code

### After Phase 1 Test:
- 200+ campaigns in database
- 12 finance sources active
- Dashboard shows real metrics
- Admin panel displays campaign data

---

## 📞 Server Info

**Server:** <server-host>  
**Admin:** https://admin.1ndirim.birdir1.com  
**API:** https://api.1ndirim.birdir1.com  
**GitHub:** https://github.com/birdir1/1ndirim

---

## ⏱️ Estimated Time

- **Deployment:** 5-10 minutes
- **Verification:** 2-3 minutes
- **Phase 1 Test:** 30-60 minutes (scraping time)

---

**Ready to deploy!** Choose an option above and proceed.
