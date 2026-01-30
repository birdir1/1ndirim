import 'package:firebase_crashlytics/firebase_crashlytics.dart';
import 'package:flutter/foundation.dart';
import '../utils/app_logger.dart';

/// Firebase Crashlytics Service
/// Production'da crash'leri ve hataları takip eder
class CrashlyticsService {
  static final CrashlyticsService _instance = CrashlyticsService._internal();
  factory CrashlyticsService() => _instance;
  CrashlyticsService._internal();

  FirebaseCrashlytics? _crashlytics;
  bool _isInitialized = false;

  /// Crashlytics'i başlat
  Future<void> initialize() async {
    try {
      _crashlytics = FirebaseCrashlytics.instance;

      // Debug mode'da crashlytics'i devre dışı bırak
      if (kDebugMode) {
        await _crashlytics!.setCrashlyticsCollectionEnabled(false);
        AppLogger.info('🔧 Crashlytics devre dışı (Debug mode)');
        return;
      }

      // Production'da aktif et
      await _crashlytics!.setCrashlyticsCollectionEnabled(true);

      // Flutter framework hatalarını yakala
      FlutterError.onError = _crashlytics!.recordFlutterFatalError;

      // Async hatalarını yakala
      PlatformDispatcher.instance.onError = (error, stack) {
        _crashlytics!.recordError(error, stack, fatal: true);
        return true;
      };

      _isInitialized = true;
      AppLogger.info('✅ Crashlytics başlatıldı');
    } catch (e) {
      AppLogger.error('❌ Crashlytics başlatılamadı: $e');
    }
  }

  /// Hata logla
  static Future<void> recordError(
    dynamic exception,
    StackTrace? stack, {
    String? reason,
    bool fatal = false,
  }) async {
    final instance = CrashlyticsService();
    if (!instance._isInitialized || instance._crashlytics == null) return;

    try {
      await instance._crashlytics!.recordError(
        exception,
        stack,
        reason: reason,
        fatal: fatal,
      );
      AppLogger.error('📊 Crashlytics: ${exception.toString()}');
    } catch (e) {
      AppLogger.error('❌ Crashlytics log hatası: $e');
    }
  }

  /// Custom log mesajı
  static Future<void> log(String message) async {
    final instance = CrashlyticsService();
    if (!instance._isInitialized || instance._crashlytics == null) return;

    try {
      await instance._crashlytics!.log(message);
    } catch (e) {
      AppLogger.error('❌ Crashlytics log hatası: $e');
    }
  }

  /// Kullanıcı ID'si set et
  static Future<void> setUserId(String userId) async {
    final instance = CrashlyticsService();
    if (!instance._isInitialized || instance._crashlytics == null) return;

    try {
      await instance._crashlytics!.setUserIdentifier(userId);
      AppLogger.info('👤 Crashlytics User ID: $userId');
    } catch (e) {
      AppLogger.error('❌ Crashlytics setUserId hatası: $e');
    }
  }

  /// Custom key-value pair ekle
  static Future<void> setCustomKey(String key, dynamic value) async {
    final instance = CrashlyticsService();
    if (!instance._isInitialized || instance._crashlytics == null) return;

    try {
      await instance._crashlytics!.setCustomKey(key, value);
    } catch (e) {
      AppLogger.error('❌ Crashlytics setCustomKey hatası: $e');
    }
  }
}
