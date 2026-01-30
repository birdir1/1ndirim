# Image Optimization Guide

Bu dokümanda image serving ve optimization stratejileri açıklanmaktadır.

## 🎯 Hedefler

- ✅ Hızlı image loading
- ✅ Bandwidth tasarrufu
- ✅ CDN entegrasyonu
- ✅ Responsive images
- ✅ WebP format desteği

---

## 📊 Mevcut Durum

### Image Sources
- Campaign images (logo, banner)
- Source logos
- User avatars (future)
- Blog images (future)

### Current Format
- PNG, JPG
- Original size (not optimized)
- No CDN
- No lazy loading

---

## 🚀 Optimization Stratejisi

### 1. Image Format

#### WebP Conversion
```bash
# Install ImageMagick
brew install imagemagick  # macOS
sudo apt install imagemagick  # Linux

# Convert to WebP
convert input.jpg -quality 80 output.webp

# Batch convert
for file in *.jpg; do
  convert "$file" -quality 80 "${file%.jpg}.webp"
done
```

#### Format Priority
1. WebP (modern browsers)
2. AVIF (future)
3. JPG/PNG (fallback)

### 2. Image Sizes

#### Responsive Sizes
```
thumbnail:  100x100   (list views)
small:      300x300   (cards)
medium:     600x600   (detail views)
large:      1200x1200 (hero images)
original:   as-is     (download)
```

#### Naming Convention
```
logo-thumbnail.webp
logo-small.webp
logo-medium.webp
logo-large.webp
logo-original.png
```

### 3. CDN Integration

#### Cloudflare Images (Recommended)
```javascript
// Image URL with transformations
const imageUrl = `https://imagedelivery.net/${accountHash}/${imageId}/public`;

// With size variant
const thumbnailUrl = `https://imagedelivery.net/${accountHash}/${imageId}/thumbnail`;
```

**Pricing:**
- $5/month for 100,000 images
- $0.50 per 1,000 additional images
- Unlimited transformations
- Automatic WebP conversion

#### Alternative: AWS S3 + CloudFront
```javascript
// S3 bucket with CloudFront
const imageUrl = `https://cdn.1indirim.com/images/${imageId}.webp`;
```

**Pricing:**
- S3: $0.023 per GB storage
- CloudFront: $0.085 per GB transfer
- More control, more setup

### 4. Image Upload Flow

```
User Upload
    ↓
Validate (size, format, dimensions)
    ↓
Generate variants (thumbnail, small, medium, large)
    ↓
Convert to WebP
    ↓
Upload to CDN/S3
    ↓
Save URLs to database
    ↓
Return URLs to client
```

---

## 💻 Implementation

### Backend: Image Upload Endpoint

```javascript
const multer = require('multer');
const sharp = require('sharp');

// Multer configuration
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images allowed'));
    }
  },
});

// Image upload endpoint
router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    const file = req.file;
    
    // Generate variants
    const variants = await generateImageVariants(file.buffer);
    
    // Upload to CDN
    const urls = await uploadToCDN(variants);
    
    res.json({
      success: true,
      urls: urls,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Generate image variants
async function generateImageVariants(buffer) {
  const variants = {};
  
  // Thumbnail (100x100)
  variants.thumbnail = await sharp(buffer)
    .resize(100, 100, { fit: 'cover' })
    .webp({ quality: 80 })
    .toBuffer();
  
  // Small (300x300)
  variants.small = await sharp(buffer)
    .resize(300, 300, { fit: 'cover' })
    .webp({ quality: 85 })
    .toBuffer();
  
  // Medium (600x600)
  variants.medium = await sharp(buffer)
    .resize(600, 600, { fit: 'cover' })
    .webp({ quality: 90 })
    .toBuffer();
  
  // Large (1200x1200)
  variants.large = await sharp(buffer)
    .resize(1200, 1200, { fit: 'inside' })
    .webp({ quality: 90 })
    .toBuffer();
  
  return variants;
}
```

### Flutter: Image Loading

```dart
import 'package:cached_network_image/cached_network_image.dart';

// Load image with caching
CachedNetworkImage(
  imageUrl: imageUrl,
  placeholder: (context, url) => CircularProgressIndicator(),
  errorWidget: (context, url, error) => Icon(Icons.error),
  fadeInDuration: Duration(milliseconds: 300),
  memCacheWidth: 600, // 2x for retina
  memCacheHeight: 600,
)

// Preload images
await precacheImage(
  CachedNetworkImageProvider(imageUrl),
  context,
);
```

---

## 📦 Required Packages

### Backend
```bash
npm install multer sharp
```

### Flutter
```yaml
dependencies:
  cached_network_image: ^3.4.1
```

---

## 🎨 Image Optimization Checklist

### Upload
- [ ] Validate file size (max 5MB)
- [ ] Validate file type (jpg, png, webp)
- [ ] Validate dimensions (min 100x100, max 4000x4000)
- [ ] Generate thumbnails
- [ ] Convert to WebP
- [ ] Upload to CDN
- [ ] Save URLs to database

### Serving
- [ ] Serve WebP when supported
- [ ] Serve JPG/PNG as fallback
- [ ] Set proper cache headers
- [ ] Use CDN
- [ ] Lazy load images
- [ ] Preload critical images

### Monitoring
- [ ] Track image load times
- [ ] Track cache hit rate
- [ ] Track bandwidth usage
- [ ] Track CDN costs

---

## 📈 Performance Metrics

### Before Optimization
```
Average image size:     500 KB
Load time:              2-3 seconds
Bandwidth per user:     10 MB/session
Cache hit rate:         0%
```

### After Optimization
```
Average image size:     50 KB (10x smaller) ⚡
Load time:              200-300ms (10x faster) ⚡
Bandwidth per user:     1 MB/session (10x less) ⚡
Cache hit rate:         80%+ ⚡
```

---

## 🛠️ Tools

### Image Optimization
- [ImageMagick](https://imagemagick.org/) - CLI tool
- [Sharp](https://sharp.pixelplumbing.com/) - Node.js library
- [Squoosh](https://squoosh.app/) - Web-based tool

### CDN Services
- [Cloudflare Images](https://www.cloudflare.com/products/cloudflare-images/)
- [AWS CloudFront](https://aws.amazon.com/cloudfront/)
- [Cloudinary](https://cloudinary.com/)
- [imgix](https://imgix.com/)

### Testing
- [WebPageTest](https://www.webpagetest.org/)
- [Google PageSpeed Insights](https://pagespeed.web.dev/)
- [GTmetrix](https://gtmetrix.com/)

---

## 🚨 Common Issues

### Issue: Images not loading

**Cause:** CORS policy  
**Solution:** Add CORS headers
```javascript
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'GET');
```

### Issue: Slow loading

**Cause:** Large image size  
**Solution:** 
1. Compress images
2. Use WebP format
3. Implement lazy loading
4. Use CDN

### Issue: High bandwidth costs

**Cause:** Serving original images  
**Solution:**
1. Generate thumbnails
2. Use responsive images
3. Implement caching
4. Use CDN

---

## 📚 Best Practices

### 1. Always Use Lazy Loading
```dart
ListView.builder(
  itemCount: items.length,
  itemBuilder: (context, index) {
    return CachedNetworkImage(
      imageUrl: items[index].imageUrl,
    );
  },
  cacheExtent: 500, // Preload 500px ahead
);
```

### 2. Preload Critical Images
```dart
@override
void didChangeDependencies() {
  super.didChangeDependencies();
  precacheImage(
    CachedNetworkImageProvider(heroImageUrl),
    context,
  );
}
```

### 3. Use Placeholders
```dart
CachedNetworkImage(
  imageUrl: imageUrl,
  placeholder: (context, url) => Container(
    color: Colors.grey[200],
    child: Icon(Icons.image),
  ),
);
```

### 4. Handle Errors Gracefully
```dart
CachedNetworkImage(
  imageUrl: imageUrl,
  errorWidget: (context, url, error) => Container(
    color: Colors.grey[100],
    child: Icon(Icons.broken_image),
  ),
);
```

### 5. Set Memory Cache Limits
```dart
CachedNetworkImage(
  imageUrl: imageUrl,
  memCacheWidth: 600,  // Limit memory usage
  memCacheHeight: 600,
);
```

---

## 🎯 Implementation Priority

### Phase 1: Quick Wins (1 day)
- [x] Add ImageService to Flutter app
- [x] Implement lazy loading
- [x] Add placeholders and error widgets
- [x] Configure cache settings

### Phase 2: Backend (1 day)
- [ ] Add image upload endpoint
- [ ] Implement image resizing
- [ ] Add WebP conversion
- [ ] Set cache headers

### Phase 3: CDN (Future)
- [ ] Choose CDN provider
- [ ] Setup CDN account
- [ ] Migrate existing images
- [ ] Update image URLs

---

**Son Güncelleme**: 30 Ocak 2026  
**Versiyon**: 1.0.0
