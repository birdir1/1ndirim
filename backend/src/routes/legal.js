const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

/**
 * GET /privacy-policy
 * Privacy Policy sayfası
 */
router.get('/privacy-policy', (req, res) => {
  try {
    // Monorepo yapısında app klasörü root'ta, backend ise backend/ klasöründe
    // Server'da: /var/www/1indirim-api/backend/src/routes/legal.js
    // Dosya: /var/www/1indirim-api/../app/PRIVACY_POLICY.md (eğer monorepo ise)
    // VEYA backend dizinine kopyalanmış olabilir
    const possiblePaths = [
      path.join(__dirname, '../../../../app/PRIVACY_POLICY.md'), // Monorepo
      path.join(__dirname, '../../../app/PRIVACY_POLICY.md'), // Backend/app
      path.join(__dirname, '../../PRIVACY_POLICY.md'), // Backend root
      '/var/www/1indirim-api/../app/PRIVACY_POLICY.md', // Server monorepo
      '/var/www/1indirim-api/app/PRIVACY_POLICY.md', // Server backend/app
    ];
    
    let filePath = null;
    let content = null;
    
    for (const p of possiblePaths) {
      try {
        if (fs.existsSync(p)) {
          filePath = p;
          content = fs.readFileSync(p, 'utf8');
          break;
        }
      } catch (e) {
        // Devam et
      }
    }
    
    if (!content) {
      throw new Error(`Privacy Policy dosyası bulunamadı. Denenen yollar: ${possiblePaths.join(', ')}`);
    }
    
    // Markdown'ı basit HTML'e çevir (basit regex ile)
    const html = convertMarkdownToHTML(content);
    
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(wrapHTML(html));
  } catch (error) {
    console.error('Privacy Policy okuma hatası:', error);
    res.status(500).send(`
      <html>
        <head><title>Privacy Policy</title></head>
        <body>
          <h1>Gizlilik Politikası</h1>
          <p>Sayfa yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.</p>
        </body>
      </html>
    `);
  }
});

/**
 * GET /terms-of-use
 * Terms of Use sayfası
 */
router.get('/terms-of-use', (req, res) => {
  try {
    // Monorepo yapısında app klasörü root'ta, backend ise backend/ klasöründe
    // Server'da: /var/www/1indirim-api/backend/src/routes/legal.js
    // Dosya: /var/www/1indirim-api/../app/TERMS_OF_USE.md (eğer monorepo ise)
    // VEYA backend dizinine kopyalanmış olabilir
    const possiblePaths = [
      path.join(__dirname, '../../../../app/TERMS_OF_USE.md'), // Monorepo
      path.join(__dirname, '../../../app/TERMS_OF_USE.md'), // Backend/app
      path.join(__dirname, '../../TERMS_OF_USE.md'), // Backend root
      '/var/www/1indirim-api/../app/TERMS_OF_USE.md', // Server monorepo
      '/var/www/1indirim-api/app/TERMS_OF_USE.md', // Server backend/app
    ];
    
    let filePath = null;
    let content = null;
    
    for (const p of possiblePaths) {
      try {
        if (fs.existsSync(p)) {
          filePath = p;
          content = fs.readFileSync(p, 'utf8');
          break;
        }
      } catch (e) {
        // Devam et
      }
    }
    
    if (!content) {
      throw new Error(`Terms of Use dosyası bulunamadı. Denenen yollar: ${possiblePaths.join(', ')}`);
    }
    
    // Markdown'ı basit HTML'e çevir
    const html = convertMarkdownToHTML(content);
    
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(wrapHTML(html));
  } catch (error) {
    console.error('Terms of Use okuma hatası:', error);
    res.status(500).send(`
      <html>
        <head><title>Terms of Use</title></head>
        <body>
          <h1>Kullanım Şartları</h1>
          <p>Sayfa yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.</p>
        </body>
      </html>
    `);
  }
});

/**
 * GET /support
 * Public support information page
 */
router.get('/support', (req, res) => {
  const html = `
<h1>1ndirim Destek</h1>
<p>Destek talepleri için bize e-posta gönderebilirsin.</p>
<ul>
  <li>E-posta: birdir1.app@gmail.com</li>
  <li>Web: https://1ndirim.birdir1.com</li>
</ul>
<h2>Hesap Silme</h2>
<p>Mobil uygulama içindeki hesap silme akışını kullanabilir veya destek e-postasına kayıtlı e-posta adresinle talep gönderebilirsin.</p>
`;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(wrapHTML(html));
});

/**
 * GET /1ben/privacy-policy
 * 1ben privacy policy page
 */
router.get('/1ben/privacy-policy', (req, res) => {
  try {
    const possiblePaths = [
      path.join(__dirname, '../../../../../../1ben/PRIVACY_POLICY.md'),
      path.join(__dirname, '../../../../../1ben/PRIVACY_POLICY.md'),
      '/var/www/1indirim-api/../1ben/PRIVACY_POLICY.md',
      '/var/www/1indirim-api/1ben/PRIVACY_POLICY.md',
    ];

    let content = null;
    for (const p of possiblePaths) {
      try {
        if (fs.existsSync(p)) {
          content = fs.readFileSync(p, 'utf8');
          break;
        }
      } catch (e) {
        // continue
      }
    }

    if (!content) {
      content = `
# 1Ben Gizlilik Politikası

1Ben uygulaması MVP sürümünde verileri öncelikle cihaz üzerinde tutar.

- Destek: birdir1.app@gmail.com
- Hesap silme: uygulama içinden \"Demo Sil / Veriyi Sıfırla\" aksiyonu
`;
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(wrapHTML(convertMarkdownToHTML(content)));
  } catch (error) {
    console.error('1ben privacy policy error:', error);
    res.status(500).send('Privacy policy yüklenemedi');
  }
});

/**
 * GET /1ben/terms-of-use
 * 1ben terms page
 */
router.get('/1ben/terms-of-use', (req, res) => {
  const markdown = `
# 1Ben Kullanım Şartları

1Ben, kişisel farkındalık ve günlük takip amaçlı bir mobil uygulamadır.

- Bu sürüm MVP kapsamındadır.
- Ticari/finansal tavsiye sunmaz.
- Destek: birdir1.app@gmail.com
`;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(wrapHTML(convertMarkdownToHTML(markdown)));
});

/**
 * GET /1ben/account-deletion
 * 1ben account deletion info page (store compliance)
 */
router.get('/1ben/account-deletion', (req, res) => {
  const markdown = `
# 1Ben Hesap ve Veri Silme

MVP sürümünde veriler cihazında tutulur.

## Uygulama içinden silme
1. Profil ekranını aç.
2. \"Demo Sil\" aksiyonunu kullan.
3. Tüm lokal kayıtlar temizlenir.

## Destek ile silme
- E-posta: birdir1.app@gmail.com
- Konu: \"1Ben Veri Silme Talebi\"
`;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(wrapHTML(convertMarkdownToHTML(markdown)));
});

/**
 * Markdown'ı basit HTML'e çevir
 */
function convertMarkdownToHTML(markdown) {
  let html = markdown;
  
  // HR (horizontal rule) çevir
  html = html.replace(/^---$/gm, '<hr>');
  
  // Başlıkları çevir (önce küçükten büyüğe)
  html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  
  // Kalın metin
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  
  // Liste öğeleri (satır başında - veya numara ile)
  const lines = html.split('\n');
  let inList = false;
  let result = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const listMatch = line.match(/^[\-\*] (.+)$/) || line.match(/^(\d+)\. (.+)$/);
    
    if (listMatch) {
      if (!inList) {
        result.push('<ul>');
        inList = true;
      }
      const content = listMatch[2] || listMatch[1];
      result.push(`<li>${content}</li>`);
    } else {
      if (inList) {
        result.push('</ul>');
        inList = false;
      }
      if (line.trim() && !line.match(/^<[h1-6]/) && !line.match(/^<hr>/) && !line.match(/^<ul>/) && !line.match(/^<\/ul>/)) {
        // Paragraf olarak ekle
        if (!line.trim().startsWith('<')) {
          result.push(`<p>${line.trim()}</p>`);
        } else {
          result.push(line);
        }
      } else if (line.trim() === '') {
        // Boş satırları koru
        result.push('');
      } else {
        result.push(line);
      }
    }
  }
  
  if (inList) {
    result.push('</ul>');
  }
  
  html = result.join('\n');
  
  // Linkler
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  
  // E-posta linkleri
  html = html.replace(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g, '<a href="mailto:$1">$1</a>');
  
  // URL'leri link yap
  html = html.replace(/(https?:\/\/[^\s<>"{}|\\^`\[\]]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
  
  return html;
}

/**
 * HTML template wrapper
 */
function wrapHTML(content) {
  return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>1ndirim - Legal</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f5f5f5;
      padding: 20px;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 {
      color: #007AFF;
      margin-bottom: 20px;
      font-size: 2em;
    }
    h2 {
      color: #333;
      margin-top: 30px;
      margin-bottom: 15px;
      font-size: 1.5em;
    }
    h3 {
      color: #555;
      margin-top: 20px;
      margin-bottom: 10px;
      font-size: 1.2em;
    }
    h4 {
      color: #666;
      margin-top: 15px;
      margin-bottom: 8px;
    }
    p {
      margin-bottom: 15px;
      text-align: justify;
    }
    ul, ol {
      margin-left: 20px;
      margin-bottom: 15px;
    }
    li {
      margin-bottom: 8px;
    }
    a {
      color: #007AFF;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    strong {
      font-weight: 600;
    }
    hr {
      border: none;
      border-top: 1px solid #ddd;
      margin: 30px 0;
    }
    @media (max-width: 768px) {
      body {
        padding: 10px;
      }
      .container {
        padding: 20px;
      }
      h1 {
        font-size: 1.5em;
      }
      h2 {
        font-size: 1.3em;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    ${content}
  </div>
</body>
</html>
  `;
}

module.exports = router;
