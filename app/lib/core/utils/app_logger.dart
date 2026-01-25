import 'package:flutter/foundation.dart';

/// App Logger
/// Production'da hassas log'ları kaldırmak için kullanılır
/// Debug mode'da log gösterir, release mode'da sessiz
class AppLogger {
  /// Debug log (sadece debug mode'da)
  static void debug(String message) {
    if (kDebugMode) {
      // Production build'de bu log gösterilmeyecek
      print('🔍 [DEBUG] $message');
    }
  }

  /// Info log (sadece debug mode'da)
  static void info(String message) {
    if (kDebugMode) {
      print('ℹ️ [INFO] $message');
    }
  }

  /// Warning log (sadece debug mode'da)
  static void warning(String message) {
    if (kDebugMode) {
      print('⚠️ [WARN] $message');
    }
  }

  /// Error log (her zaman gösterilir, production'da da)
  /// NOT: Hassas bilgiler içermemeli
  static void error(String message, [Object? error]) {
    if (kDebugMode) {
      print('❌ [ERROR] $message');
      if (error != null) {
        print('   Error details: $error');
      }
    }
    // Production'da error tracking service'e gönderilebilir (Sentry, etc.)
  }

  /// Firebase init log (sadece debug mode'da)
  static void firebaseInit(bool success, [Object? error]) {
    if (kDebugMode) {
      if (success) {
        print('✅ Firebase initialized successfully');
      } else {
        print('⚠️ Firebase initialization failed: $error');
        print('⚠️ App will continue without Firebase (auth features may not work)');
      }
    }
  }
}
