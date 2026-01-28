const admin = require('firebase-admin');

/**
 * Firebase Admin SDK initialization
 * Environment variable: GOOGLE_APPLICATION_CREDENTIALS veya serviceAccount
 */
let firebaseAdmin = null;

try {
  // Firebase Admin SDK'yı initialize et
  // Production'da GOOGLE_APPLICATION_CREDENTIALS env variable kullanılmalı
  // Development'ta serviceAccount JSON dosyası kullanılabilir
  
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // Service account key file path
    const serviceAccount = require(process.env.GOOGLE_APPLICATION_CREDENTIALS);
    firebaseAdmin = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // Service account JSON string
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    firebaseAdmin = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else {
    console.warn('⚠️ Firebase Admin SDK yapılandırılmamış. Authentication middleware çalışmayacak.');
  }
} catch (error) {
  console.warn('⚠️ Firebase Admin SDK başlatılamadı:', error.message);
  console.warn('⚠️ Authentication middleware devre dışı kalacak.');
}

/**
 * Firebase Authentication Middleware
 * 
 * Request header'dan Authorization token'ı alır ve Firebase ile doğrular.
 * Başarılı olursa req.user objesine user bilgilerini ekler.
 * 
 * Usage:
 *   router.get('/protected', firebaseAuth, (req, res) => {
 *     const userId = req.user.uid;
 *     // ...
 *   });
 */
const firebaseAuth = async (req, res, next) => {
  // Firebase Admin SDK yoksa skip et (development için)
  if (!firebaseAdmin) {
    // Development modunda mock user ekle (opsiyonel)
    if (process.env.NODE_ENV === 'development' && process.env.MOCK_USER_ID) {
      req.user = {
        uid: process.env.MOCK_USER_ID,
        email: 'dev@example.com',
      };
      return next();
    }
    
    // Production'da hata döndür
    return res.status(500).json({
      success: false,
      error: 'Authentication servisi yapılandırılmamış',
    });
  }

  try {
    // Authorization header'dan token'ı al
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authorization token gerekli',
        message: 'Header formatı: Authorization: Bearer <token>',
      });
    }

    // Token'ı extract et
    const token = authHeader.split('Bearer ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authorization token bulunamadı',
      });
    }

    // Firebase ile token'ı doğrula
    const decodedToken = await firebaseAdmin.auth().verifyIdToken(token);

    // User bilgilerini req.user'a ekle
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
      name: decodedToken.name,
      picture: decodedToken.picture,
    };

    // Sonraki middleware'e geç
    next();
  } catch (error) {
    console.error('Firebase auth error:', error.message);
    
    // Token geçersiz veya süresi dolmuş
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        success: false,
        error: 'Token süresi dolmuş',
        message: 'Lütfen yeniden giriş yapın',
      });
    }

    if (error.code === 'auth/argument-error') {
      return res.status(401).json({
        success: false,
        error: 'Geçersiz token',
        message: 'Token formatı hatalı',
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Authentication başarısız',
      message: error.message,
    });
  }
};

/**
 * Optional Firebase Auth Middleware
 * 
 * Token varsa doğrular, yoksa req.user = null yapar.
 * Public endpoint'lerde kullanılabilir (kullanıcı bilgisi opsiyonel).
 */
const optionalFirebaseAuth = async (req, res, next) => {
  if (!firebaseAdmin) {
    req.user = null;
    return next();
  }

  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.split('Bearer ')[1];
    
    if (!token) {
      req.user = null;
      return next();
    }

    const decodedToken = await firebaseAdmin.auth().verifyIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
      name: decodedToken.name,
      picture: decodedToken.picture,
    };

    next();
  } catch (error) {
    // Hata durumunda user = null yap ve devam et
    req.user = null;
    next();
  }
};

module.exports = {
  firebaseAuth,
  optionalFirebaseAuth,
};
