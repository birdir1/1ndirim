# Railway + Vercel Deploy (1ndirim Monorepo)

> **Hiç bilmiyorsan önce şu rehberi oku:** [ADIM-ADIM-DEPLOY-REHBERI.md](./ADIM-ADIM-DEPLOY-REHBERI.md) — Railway’e giriş, Root Directory, Variables ve domain alma adımları ekran ekran anlatılıyor.

## 1) En doğru yaklaşım

- **Backend:** Railway’de **tek servis**, build context = `backend/` → **Root Directory = `backend`**.  
  Böylece `backend/package.json` + `backend/package-lock.json` ile `npm ci` çalışır, lockfile hatası kalkar.

- **Bot:** İstersen ayrı Railway servisi; Root Directory = `bot`, kendi Dockerfile.

- **Admin-panel:** **Vercel** (Next.js için önerilen). İstersen Railway’de ayrı servis de olur.

- Root’ta `package.json` / `package-lock.json` zorunlu değil; **her servis kendi klasöründen** build edilir.

---

## 2) Backend — Railway

### 2.1 Repo / servis

- GitHub: `birdir1/1ndirim`.
- Railway’de yeni proje → “Deploy from GitHub” → bu repo.
- Bu projede **Backend** adında bir servis kullan (veya mevcut backend servisini buna çevir).

### 2.2 Backend servis ayarları (zorunlu)

| Ayar | Değer |
|------|--------|
| **Root Directory** | `backend` |
| **Builder** | Dockerfile (Nixpacks değil) |
| **Dockerfile Path** | `Dockerfile` (root = `backend` olduğu için `backend/Dockerfile` otomatik kullanılır) |
| **Build Command** | (boş, Dockerfile build kullanılır) |
| **Start Command** | (boş, Dockerfile `CMD` kullanılır) |

Bu ayarla build, `backend/` içinden yapılır ve `backend/package-lock.json` var olduğu için `npm ci` hatası oluşmaz.

### 2.3 Ortam değişkenleri (örnek)

- `NODE_ENV=production`
- `PORT=3000` (Railway kendi PORT’unu da verebilir; uygulama env’den okumalı)
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` → Railway’de PostgreSQL eklersen otomatik gelir veya kendi DB’ni yazarsın.

### 2.4 Kullanılan Dockerfile

`backend/Dockerfile` (mevcut, sadece lockfile zorunlu hale getirildi):

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# ... user, expose, healthcheck, CMD
```

- Build context = `backend/` olduğu için `package.json` ve `package-lock.json` buradan kopyalanır.

---

## 3) Bot — Railway (ayrı servis, isteğe bağlı)

- Yeni servis → aynı repo.
- **Root Directory** = `bot`.
- **Builder** = Dockerfile.
- `bot/package-lock.json` var; `bot/Dockerfile` içinde `npm ci` sorunsuz çalışır.
- Gerekli env: `BACKEND_API_URL`, `NODE_ENV`, vb.

---

## 4) Admin-panel — Vercel (önerilen)

- Next.js olduğu için Vercel daha uygun (zero-config, edge, preview URL’ler).
- Vercel’de “Import” → `birdir1/1ndirim` → **Root Directory** = `admin-panel`.
- Build / start otomatik algılanır.
- Env: `NEXT_PUBLIC_BACKEND_BASE_URL` = Railway backend URL (ör. `https://xxx.railway.app`).

İstersen admin-panel’i Railway’de de açabilirsin (Root Directory = `admin-panel`, Nixpacks/Next.js); o zaman da aynı env’i verirsin.

---

## 5) `npm ci` vs `npm install`

- **Production build’de `npm ci` kullan:**
  - `package-lock.json` ile birebir aynı sürümleri kurar, tekrarlanabilir build sağlar.
  - `npm install` ise lock’u güncelleyebilir, production’da istenmez.
- **Lockfile yoksa** `npm ci` çalışmaz; bu yüzden her uygulama klasöründe (`backend/`, `bot/`) `package-lock.json` tutulmalı.  
  Eksikse: `cd backend && npm install` (veya `cd bot && npm install`) yapıp üretilen `package-lock.json`’ı commit’le.

---

## 6) Node 20 + stabil production

- Dockerfile’larda `node:20-alpine` kullan (şu an backend için öyle).
- `NODE_ENV=production` production stage’de set edildi.
- Bağımlılıklar `npm ci --omit=dev` ile sadece production alınıyor.

---

## 7) “Bu yapıyla deploy %100 geçer” checklist

- [ ] Railway’de Backend servisi için **Root Directory = `backend`**.
- [ ] Aynı serviste **Builder = Dockerfile** (Nixpacks kapalı / override).
- [ ] `backend/package-lock.json` repo’da var ve commit’li.
- [ ] Backend için `DB_*` ve `PORT` env’leri tanımlı.
- [ ] Admin-panel için Vercel’de Root = `admin-panel`, `NEXT_PUBLIC_BACKEND_BASE_URL` = backend URL.
- [ ] (Opsiyonel) Bot ayrı servisse Root = `bot`, kendi env’leri tanımlı.

Bu adımlarla backend build’de “can only install with an existing package-lock.json” hatası almaman gerekir; sorun build context’in root olmasından kaynaklanıyordu, `backend` root yapınca çözülür.
