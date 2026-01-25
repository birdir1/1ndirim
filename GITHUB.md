# GitHub’a Bağlama ve Gönderme

Repo zaten GitHub’a bağlı: `https://github.com/birdir1/1ndirim.git`

## Senin yapman gerekenler

### 1. Değişiklikleri stage et ve commit et

Terminalde proje kökünde (`1ndirim/`):

```bash
cd /Users/shadow/birdir1/1ndirim

# Tüm değişiklikleri ekle (yeni + değişen dosyalar)
git add .

# İstersen önce ne eklendiğine bak
# git status

# Commit (mesajı istediğin gibi yazabilirsin)
git commit -m "FAZ 18–22: admin suggestions, governance, execution bridge, admin panel"
```

### 2. GitHub’a gönder (push)

```bash
git push -u origin main
```

- İlk seferde GitHub kullanıcı adı ve şifre/Token isteyebilir.
- Şifre kullanıyorsan: hesap ayarlarından **Personal Access Token** açıp onu şifre yerine kullan.
- SSH kullanmak istersen:
  ```bash
  git remote set-url origin git@github.com:birdir1/1ndirim.git
  git push -u origin main
  ```

### 3. Repo GitHub’da yoksa

1. https://github.com/new adresinden `birdir1/1ndirim` adında **boş** bir repo oluştur (README, .gitignore ekleme).
2. Zaten `origin` bu adrese ayarlı; sadece yukarıdaki `git add` / `git commit` / `git push` adımlarını uygula.

---

**Özet:** `git add .` → `git commit -m "mesaj"` → `git push -u origin main`.  
Bağlantı hazır; sadece commit ve push yeterli.
