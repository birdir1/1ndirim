import 'dart:io';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../utils/app_logger.dart';

/// Authentication Service
/// Apple Sign-In ve Google Sign-In işlemlerini yönetir
class AuthService {
  static AuthService? _instance;
  static AuthService get instance {
    _instance ??= AuthService._();
    return _instance!;
  }

  AuthService._();

  // Firebase Auth instance (lazy initialization - Firebase olmayabilir)
  FirebaseAuth? get _firebaseAuth {
    try {
      return FirebaseAuth.instance;
    } catch (e) {
      AppLogger.warning('Firebase Auth not available: $e');
      return null;
    }
  }

  // GoogleSignIn lazy initialization - sadece gerektiğinde initialize et
  GoogleSignIn? _googleSignIn;
  GoogleSignIn? get googleSignIn {
    try {
      _googleSignIn ??= GoogleSignIn(
        scopes: ['email', 'profile'],
      );
      return _googleSignIn;
    } catch (e) {
      AppLogger.warning('GoogleSignIn initialization failed: $e');
      return null;
    }
  }

  // SharedPreferences keys
  static const String _keyAppleUserId = 'apple_user_id';
  static const String _keyGoogleUserId = 'google_user_id';
  static const String _keyAuthProvider = 'auth_provider'; // 'apple', 'google', 'email'
  static const String _keyUserName = 'user_name';

  // ========== Apple Sign-In ==========

  /// Apple Sign-In işlemini başlatır
  /// iOS'ta çalışır, diğer platformlarda null döner
  /// Firebase Authentication ile entegre edilmiştir
  Future<AppleSignInResult?> signInWithApple() async {
    if (!Platform.isIOS) {
      return null;
    }

    // Firebase kontrolü
    if (_firebaseAuth == null) {
      throw AuthException(
        'Firebase yapılandırması eksik.\n\nYapılması gerekenler:\n1. Firebase Console\'dan GoogleService-Info.plist dosyasını indir\n2. app/ios/Runner/ klasörüne kopyala\n3. Xcode\'da projeye ekle\n4. Apple Sign In capability\'yi ekle (Xcode → Signing & Capabilities)',
      );
    }

    try {
      // 1. Apple Sign-In credential'ı al
      final appleCredential = await SignInWithApple.getAppleIDCredential(
        scopes: [
          AppleIDAuthorizationScopes.email,
          AppleIDAuthorizationScopes.fullName,
        ],
      );

      // User identifier kontrolü (null olamaz)
      final userId = appleCredential.userIdentifier;
      if (userId == null) {
        throw AuthException('Apple Sign-In: User identifier alınamadı');
      }

      // 2. Firebase'e Apple credential ile sign in
      // Apple Sign-In için sadece identityToken kullanılır
      if (appleCredential.identityToken == null) {
        throw AuthException('Apple Sign-In: Identity token alınamadı');
      }
      
      // Firebase kontrolü
      if (_firebaseAuth == null) {
        throw AuthException('Firebase is not initialized. Please check your Firebase configuration.');
      }
      
      final oauthCredential = OAuthProvider("apple.com").credential(
        idToken: appleCredential.identityToken!,
      );

      final userCredential = await _firebaseAuth!.signInWithCredential(oauthCredential);
      final firebaseUser = userCredential.user;

      if (firebaseUser == null) {
        throw AuthException('Firebase Authentication başarısız');
      }

      // 3. User identifier'ı kaydet (geriye dönük uyumluluk için)
      await _saveAppleUserId(userId);
      await _saveAuthProvider('apple');

      // 4. Email ve name bilgilerini al
      // Email sadece ilk login'de gelir, sonraki login'lerde Firebase'den alınır
      final email = appleCredential.email ?? firebaseUser.email;
      final name = appleCredential.givenName != null && appleCredential.familyName != null
          ? '${appleCredential.givenName} ${appleCredential.familyName}'
          : firebaseUser.displayName;

      // 5. Kullanıcı adını kaydet
      if (name != null && name.isNotEmpty) {
        await _saveUserName(name);
        // Firebase user profile'ını güncelle
        await firebaseUser.updateDisplayName(name);
      }

      return AppleSignInResult(
        userId: userId,
        email: email,
        name: name,
        identityToken: appleCredential.identityToken,
        authorizationCode: appleCredential.authorizationCode,
      );
    } on SignInWithAppleAuthorizationException catch (e) {
      if (e.code == AuthorizationErrorCode.canceled) {
        // Kullanıcı iptal etti
        return null;
      }
      // Apple Sign-In capability eksikse özel mesaj
      if (e.code == AuthorizationErrorCode.unknown) {
        throw AuthException(
          'Apple Sign-In yapılandırması eksik.\n\nYapılması gerekenler:\n1. Xcode\'da projeyi aç\n2. Runner → Signing & Capabilities → "+ Capability" → "Sign in with Apple" ekle\n3. Firebase Console\'dan GoogleService-Info.plist dosyasını indir ve ekle',
        );
      }
      throw AuthException('Apple Sign-In hatası: ${e.message}');
    } on FirebaseAuthException catch (e) {
      throw AuthException('Firebase Authentication hatası: ${e.message}');
    } catch (e) {
      final errorStr = e.toString().toLowerCase();
      if (errorStr.contains('capability') || errorStr.contains('entitlement') || errorStr.contains('firebase')) {
        throw AuthException(
          'Apple Sign-In yapılandırması eksik.\n\nYapılması gerekenler:\n1. Xcode\'da Runner → Signing & Capabilities → "+ Capability" → "Sign in with Apple"\n2. Firebase Console\'dan GoogleService-Info.plist dosyasını indir ve app/ios/Runner/ klasörüne ekle',
        );
      }
      throw AuthException('Apple Sign-In başarısız: ${e.toString()}');
    }
  }

  /// Apple user ID'yi kaydeder
  Future<void> _saveAppleUserId(String? userId) async {
    if (userId == null) return;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyAppleUserId, userId);
  }

  /// Kaydedilmiş Apple user ID'yi getirir
  Future<String?> getAppleUserId() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_keyAppleUserId);
  }

  // ========== Google Sign-In ==========

  /// Google Sign-In işlemini başlatır
  /// Android ve iOS'ta çalışır
  /// Firebase Authentication ile entegre edilmiştir
  Future<GoogleSignInResult?> signInWithGoogle() async {
    // GoogleSignIn kontrolü
    if (googleSignIn == null) {
      throw AuthException('Google Sign-In yapılandırması eksik. Info.plist dosyasına gerçek GIDClientID eklenmelidir.');
    }

    try {
      // 1. Google Sign-In account'u al
      final GoogleSignInAccount? account = await googleSignIn!.signIn();

      if (account == null) {
        // Kullanıcı iptal etti
        return null;
      }

      // 2. Google Authentication bilgilerini al
      final GoogleSignInAuthentication googleAuth = await account.authentication;

      // 3. Firebase'e Google credential ile sign in
      // Firebase kontrolü
      if (_firebaseAuth == null) {
        throw AuthException('Firebase is not initialized. Please check your Firebase configuration.');
      }
      
      final credential = GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );
      
      final userCredential = await _firebaseAuth!.signInWithCredential(credential);
      final firebaseUser = userCredential.user;

      if (firebaseUser == null) {
        throw AuthException('Firebase Authentication başarısız');
      }

      // 4. User ID'yi kaydet (geriye dönük uyumluluk için)
      await _saveGoogleUserId(account.id);
      await _saveAuthProvider('google');

      // 5. Kullanıcı adını kaydet
      final name = account.displayName;
      if (name != null && name.isNotEmpty) {
        await _saveUserName(name);
        // Firebase user profile'ını güncelle
        await firebaseUser.updateDisplayName(name);
        if (account.photoUrl != null) {
          await firebaseUser.updatePhotoURL(account.photoUrl);
        }
      }

      return GoogleSignInResult(
        userId: account.id,
        email: account.email,
        name: name,
        photoUrl: account.photoUrl,
        idToken: googleAuth.idToken,
        accessToken: googleAuth.accessToken,
      );
    } on FirebaseAuthException catch (e) {
      throw AuthException('Firebase Authentication hatası: ${e.message}');
    } catch (e) {
      // iOS'ta GIDClientID veya URL scheme hatası için özel mesaj
      final errorStr = e.toString().toLowerCase();
      if (Platform.isIOS && (errorStr.contains('gidclientid') || errorStr.contains('url scheme') || errorStr.contains('missing support') || errorStr.contains('nsinvalidargument'))) {
        throw AuthException(
          'Google Sign-In yapılandırması eksik.\n\nYapılması gerekenler:\n1. Firebase Console → Authentication → Sign-in method → Google → "Web client ID" değerini kopyala\n2. Info.plist\'te GIDClientID değerini güncelle\n3. GoogleService-Info.plist dosyasındaki REVERSED_CLIENT_ID değerini Info.plist\'teki CFBundleURLSchemes\'a ekle\n4. GoogleService-Info.plist dosyasını app/ios/Runner/ klasörüne ekle',
        );
      }
      throw AuthException('Google Sign-In başarısız: ${e.toString()}');
    }
  }

  /// Google user ID'yi kaydeder
  Future<void> _saveGoogleUserId(String? userId) async {
    if (userId == null) return;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyGoogleUserId, userId);
  }

  /// Kaydedilmiş Google user ID'yi getirir
  Future<String?> getGoogleUserId() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_keyGoogleUserId);
  }

  /// Auth provider'ı kaydeder
  Future<void> _saveAuthProvider(String provider) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyAuthProvider, provider);
  }

  /// Kaydedilmiş auth provider'ı getirir
  Future<String?> getAuthProvider() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_keyAuthProvider);
  }

  /// Kullanıcı adını kaydeder
  Future<void> _saveUserName(String? name) async {
    if (name == null || name.isEmpty) return;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyUserName, name);
  }

  /// Kaydedilmiş kullanıcı adını getirir
  Future<String?> getUserName() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_keyUserName);
  }

  /// Google Sign-In'den çıkış yapar
  Future<void> signOutGoogle() async {
    try {
      if (googleSignIn != null) {
        await googleSignIn!.signOut();
      }
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_keyGoogleUserId);
    } catch (e) {
      AppLogger.warning('Google Sign-Out hatası: $e');
    }
  }

  /// Firebase'den çıkış yapar
  Future<void> signOutFirebase() async {
    try {
      if (_firebaseAuth != null) {
        await _firebaseAuth!.signOut();
      }
    } catch (e) {
      AppLogger.warning('Firebase Sign-Out hatası: $e');
    }
  }

  /// Mevcut Firebase kullanıcısını getirir
  User? getCurrentFirebaseUser() {
    try {
      return _firebaseAuth?.currentUser;
    } catch (e) {
      AppLogger.warning('getCurrentFirebaseUser error: $e');
      return null;
    }
  }

  /// Firebase auth state değişikliklerini dinler
  Stream<User?> get authStateChanges {
    try {
      return _firebaseAuth?.authStateChanges() ?? const Stream.empty();
    } catch (e) {
      AppLogger.warning('authStateChanges error: $e');
      return const Stream.empty();
    }
  }

  /// Tüm auth verilerini temizler
  Future<void> clearAuthData() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_keyAppleUserId);
    await prefs.remove(_keyGoogleUserId);
    await prefs.remove(_keyAuthProvider);
    await prefs.remove(_keyUserName);
    await signOutGoogle();
    await signOutFirebase();
  }
}

/// Apple Sign-In sonucu
class AppleSignInResult {
  final String userId;
  final String? email;
  final String? name;
  final String? identityToken;
  final String? authorizationCode;

  AppleSignInResult({
    required this.userId,
    this.email,
    this.name,
    this.identityToken,
    this.authorizationCode,
  });
}

/// Google Sign-In sonucu
class GoogleSignInResult {
  final String userId;
  final String? email;
  final String? name;
  final String? photoUrl;
  final String? idToken;
  final String? accessToken;

  GoogleSignInResult({
    required this.userId,
    this.email,
    this.name,
    this.photoUrl,
    this.idToken,
    this.accessToken,
  });
}

/// Authentication exception
class AuthException implements Exception {
  final String message;

  AuthException(this.message);

  @override
  String toString() => message;
}
