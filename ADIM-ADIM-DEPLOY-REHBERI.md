# 1ndirim — Sıfırdan Deploy Rehberi (Hiç Bilmeyenler İçin)

Bu rehber, projeyi **hiç bilgisayar/terminal bilgisi olmadan** mümkün olduğunca tarayıcıdan, tıklayarak yapman için yazıldı. Backend’i **Railway**’e, admin panelini (istersen) **Vercel**’e koyacağız.

---

## Genel Bakış (Ne yapacağız?)

1. **Backend** → Sunucudaki API’yi (Node.js) **Railway**’de çalıştıracağız.
2. **Admin Panel** → (İstersen) **Vercel**’de yayınlayacağız.
3. **Bot** → Şimdilik atlayabilirsin; ileride istersen Railway’de ayrı servis açarsın.

Önce sadece **Backend’i Railway’e koymayı** adım adım anlatacağım. Bunu yaptıktan sonra “çalışıyor mu?” diye nasıl kontrol edeceğini de yazacağım.

---

# BÖLÜM A — Railway’e Giriş ve Proje Açma

## Adım 1: Railway’e git ve giriş yap

1. Tarayıcıda **https://railway.app** adresine git.
2. Sağ üstten **“Login”** (veya “Start a Project”) tıkla.
3. **“Login with GitHub”** seç → GitHub hesabınla giriş yap.
   - GitHub hesabın yoksa önce https://github.com adresinden ücretsiz hesap aç.

Giriş yaptıktan sonra Railway’in ana sayfasına düşeceksin.

---

## Adım 2: Yeni proje oluştur (GitHub’dan)

1. **“New Project”** (veya “Create Project”) butonuna tıkla.
2. Açılan ekranda **“Deploy from GitHub repo”** seçeneğini seç.
3. Eğer “Configure GitHub App” veya “ GitHub’a bağlan” gibi bir şey çıkarsa:
   - Tıkla ve **sadece `birdir1/1ndirim`** reposuna erişim ver (veya “All repos” dersen tüm repolarını bağlar).
4. Repo listesinden **`birdir1/1ndirim`** (veya `1ndirim`) reposunu seç.
5. “Deploy” / “Add” gibi bir buton varsa tıkla.

Bu aşamadan sonra Railway, repoyu alıp **otomatik bir servis** oluşturmaya çalışacak. İlk build büyük ihtimalle **hatalı** olacak çünkü proje kökünde `package-lock.json` yok. Bunu bir sonraki bölümde düzelteceğiz.

---

## Adım 3: Oluşan servise tıkla

- Proje açıldığında bir “service” (kutu/kart) görürsün. Üzerine tıkla.
- Servis ekranında üstte **“Deployments”**, **“Settings”**, **“Variables”** gibi sekmeler olur.  
- Önce **Settings**’e gideceğiz.

---

# BÖLÜM B — Backend İçin Doğru Ayarları Yapmak

Bu ayarlar, build’in **proje kökü** yerine **`backend`** klasöründen yapılmasını sağlar. Böylece `backend/package-lock.json` kullanılır ve “can only install with an existing package-lock.json” hatası çıkmaz.

## Adım 4: Root Directory’yi `backend` yap

1. Servis içindeyken sol veya üst menüden **“Settings”** sekmesine gir.
2. Sayfayı aşağı kaydır; **“Build”** veya **“Source”** bölümünü bul.
3. **“Root Directory”** (veya “Service Root”) gibi bir alan ara.
   - Bazı arayüzlerde “Monorepo” / “Subdirectory” diye de geçebilir.
4. Bu alana **tam olarak** şunu yaz:  
   **`backend`**  
   (küçük harf, boşluksuz, başında/sonunda slash yok.)
5. **“Save”** veya **“Update”** varsa tıkla.

Bu adımı yapmazsan Railway proje kökünden build alır; orada lockfile olmadığı için `npm ci` hatası alırsın.

---

## Adım 5: Builder’ı “Dockerfile” yap

1. Aynı **Settings** sayfasında **“Builder”** veya **“Build Method”** / **“Build Type”** gibi bir seçenek ara.
2. Açılır menüden **“Dockerfile”** seç.
3. **“Dockerfile Path”** diye bir alan varsa:
   - Root Directory zaten `backend` olduğu için **sadece** `Dockerfile` yazman yeterli (veya boş bırakırsan `backend/Dockerfile` otomatik kullanılır).
4. **Build Command** ve **Start Command** alanlarını **boş bırak** — Dockerfile içinde zaten build ve başlatma komutları tanımlı.
5. Değişiklikleri **kaydet**.

Özet: Root = `backend`, Builder = Dockerfile. Geri kalanı varsayılan bırak.

---

# BÖLÜM C — Ortam Değişkenlerini (Environment Variables) Eklemek

Backend’in çalışması için sunucuda bazı “ayarlar” (ortam değişkenleri) tanımlanmalı. Bunlar şifre, veritabanı adresi gibi şeyler.

## Adım 6: Variables sekmesine gir

1. Serviste **“Variables”** (veya “Environment”) sekmesine tıkla.
2. **“Add Variable”** / **“New Variable”** / **“RAW Editor”** gibi bir buton görürsün.

## Adım 7: Bu değişkenleri tek tek ekle

Aşağıdakileri **isim = değer** şeklinde ekle. Değerleri kendi veritabanı bilgilerinle değiştir (şimdilik DB yoksa aşağıdaki “DB’siz deneme” kısmına bak).

| Değişken adı   | Örnek değer       | Açıklama                          |
|----------------|-------------------|-----------------------------------|
| `NODE_ENV`     | `production`      | Her zaman böyle yaz.              |
| `PORT`         | `3000`            | Railway kendi PORT’unu da verebilir; uygulama `process.env.PORT \|\| 3000` kullanıyorsa sorun olmaz. |
| `DB_HOST`      | `localhost` veya Railway DB’nin host’u | Veritabanı sunucusu.              |
| `DB_PORT`      | `5432`            | Veritabanı portu (PostgreSQL varsayılanı). |
| `DB_NAME`      | `indirim_db`      | Veritabanı adı.                   |
| `DB_USER`      | `postgres`        | Veritabanı kullanıcı adı.         |
| `DB_PASSWORD`  | **(gerçek şifre)**| Veritabanı şifresi.               |

Nasıl eklenir (genelde):

- **“Add Variable”** → **Name:** `NODE_ENV`, **Value:** `production` → Save.
- Aynı şekilde `PORT`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` ekle.

**Veritabanı henüz yoksa (sadece “çalışıyor mu?” denemek istiyorsan):**  
- `NODE_ENV=production` ve `PORT=3000` eklemen yeterli olabilir; uygulama DB’ye bağlanamazsa hata verebilir ama “build geçti mi, container ayağa kalktı mı?” bunu anlarsın.  
- Gerçek kullanım için Railway’de **PostgreSQL** ekleyip, Railway’in verdiği `DATABASE_URL` veya `PGHOST`, `PGUSER` vb. değişkenleri projenin beklediği `DB_*` isimleriyle eşleştirmen gerekir (Adım 10’da kısaca anlatıyorum).

---

# BÖLÜM D — Deploy’u Tetiklemek ve URL Almak

## Adım 8: Yeni bir deploy başlat

- Ayarları ve değişkenleri kaydettikten sonra Railway bazen otomatik “Redeploy” önerir.
- Önermezse: **“Deployments”** sekmesine gir → en üstte **“Deploy”** / **“Redeploy”** veya **“Trigger Deploy”** gibi bir buton varsa tıkla.
- Ya da **Settings**’te kaydettiğinde “Redeploy?” diye soruyorsa **Evet** de.

Build log’larını **Deployments** sekmesinde, ilgili deploy’a tıklayıp “View logs” ile izleyebilirsin.  
- “Build completed”, “Deploy live” gibi yeşil/başarılı görünüyorsa build tamamlanmış demektir.

## Adım 9: Dışarıya açık URL (domain) ver

1. Serviste **“Settings”** veya **“Networking”** / **“Public Networking”** bölümüne gir.
2. **“Generate Domain”** veya **“Create Domain”** / **“Add Public Domain”** butonuna tıkla.
3. Railway otomatik bir adres üretir, örneğin:  
   **`https://1ndirim-backend-production-xxxx.up.railway.app`**
4. Bu adresi kopyala; **backend’in canlı adresi** bu olacak.

Artık tarayıcıda şunu deneyebilirsin:

- **`https://BURAYA-URL-YAPIŞTIR/api/health`**  
  Örnek: `https://1ndirim-backend-production-xxxx.up.railway.app/api/health`

Sayfa “OK” veya kısa bir JSON (ör. `{"status":"ok"}`) döndürüyorsa backend ayakta demektir.

---

# BÖLÜM E — (İsteğe Bağlı) Railway’de PostgreSQL

Backend’in gerçekten veritabanı kullanması için Railway’e PostgreSQL ekleyebilirsin:

## Adım 10: Aynı projede PostgreSQL ekle

1. Railway proje sayfasında (servislerin listelendiği yerde) **“New”** / **“+”** veya **“Add Service”** tıkla.
2. **“Database”** → **“PostgreSQL”** seç.
3. Oluşan PostgreSQL servisine tıkla → **“Variables”** veya **“Connect”** sekmesinde Railway sana şunlar gibi değişkenler verir:
   - `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`  
   veya tek satırda `DATABASE_URL`.
4. Bu değerleri **backend servisinin** Variables kısmına, backend’in beklediği isimlerle ekle:
   - `DB_HOST` = `PGHOST` değeri  
   - `DB_PORT` = `PGPORT` değeri  
   - `DB_USER` = `PGUSER` değeri  
   - `DB_PASSWORD` = `PGPASSWORD` değeri  
   - `DB_NAME` = `PGDATABASE` değeri  

Sonra backend servisini **Redeploy** et. Böylece backend, Railway’deki PostgreSQL’e bağlanır.

---

# BÖLÜM F — Özet Checklist (Backend)

- [ ] Railway’e GitHub ile giriş yaptım.
- [ ] `birdir1/1ndirim` reposundan yeni proje oluşturdum.
- [ ] Backend servisinde **Settings** → **Root Directory** = **`backend`** yaptım.
- [ ] **Builder** = **Dockerfile** seçtim; Build/Start command boş.
- [ ] **Variables**’a en azından `NODE_ENV=production`, `PORT=3000` ve (varsa) `DB_*` değişkenlerini ekledim.
- [ ] Deploy’u tetikledim; build hatasız bitti.
- [ ] **Generate Domain** ile dış URL aldım.
- [ ] `https://...railway.app/api/health` adresini açınca “OK” veya sağlık JSON’u gördüm.

Bu checklist’i tamamladıysan backend deploy’u tamam demektir.

---

# BÖLÜM G — Admin Panel’i Vercel’de Açmak (İsteğe Bağlı)

Admin panel Next.js ile yazıldığı için **Vercel**’de yayınlamak çok kolay:

1. **https://vercel.com** adresine git → GitHub ile giriş yap.
2. **“Add New Project”** / **“Import Project”** → GitHub’dan **`birdir1/1ndirim`** reposunu seç.
3. **“Root Directory”** alanında **“Edit”** deyip **`admin-panel`** yaz.
4. **Environment Variable** ekle:  
   - Name: `NEXT_PUBLIC_BACKEND_BASE_URL`  
   - Value: Railway’den aldığın backend URL (örn. `https://1ndirim-backend-production-xxxx.up.railway.app`)  
   - Sonunda `/api` veya ek yol ekleme; sadece base URL yeterli (örn. `https://...railway.app`).
5. **Deploy** tıkla.  
Build bittikten sonra Vercel sana bir adres verir (örn. `https://1ndirim-admin-xxx.vercel.app`). Bu adresten admin panele erişebilirsin; panel, `NEXT_PUBLIC_BACKEND_BASE_URL` ile backend’e istek atar.

---

# Sık Karşılaşılan Sorunlar

- **“can only install with an existing package-lock.json”**  
  → Root Directory’yi **`backend`** yaptığından ve Builder’ı **Dockerfile** seçtiğinden emin ol. Redeploy et.

- **Build geçiyor ama sayfa açılmıyor / 502**  
  → Variables’ta `PORT=3000` (veya Railway’in verdiği PORT) ve `NODE_ENV=production` olduğundan emin ol. Uygulama `process.env.PORT` kullanıyorsa Railway’in atadığı port otomatik gelir; yine de denemek için `PORT=3000` ekleyebilirsin.

- **Veritabanı bağlantı hatası**  
  → Backend’teki `DB_*` değişkenlerini, Railway PostgreSQL’in verdiği `PG*` değerleriyle bire bir eşleştir. Redeploy et.

- **Admin panel “network error” veriyor**  
  → Vercel’de `NEXT_PUBLIC_BACKEND_BASE_URL` tam olarak Railway backend URL’i mi (https ile, sonunda slash yok) kontrol et.

---

Daha detaylı teknik notlar ve “Nixpacks vs Dockerfile” gibi konular için ana deploy dokümanına bak: **DEPLOY.md**.
