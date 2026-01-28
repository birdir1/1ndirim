import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import '../utils/app_logger.dart';
import 'auth_service.dart';
import '../../data/datasources/favorite_api_datasource.dart';

/// Push notification servisi
/// Firebase Cloud Messaging (FCM) ile entegre
class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  String? _fcmToken;
  bool _initialized = false;

  /// Servisi başlatır
  Future<void> initialize() async {
    if (_initialized) return;

    try {
      // İzin iste (iOS için)
      NotificationSettings settings = await _messaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
        provisional: false,
      );

      if (settings.authorizationStatus == AuthorizationStatus.authorized) {
        AppLogger.info('✅ Push notification izni verildi');
      } else if (settings.authorizationStatus == AuthorizationStatus.provisional) {
        AppLogger.info('⚠️ Push notification geçici izin verildi');
      } else {
        AppLogger.warning('❌ Push notification izni reddedildi');
        return;
      }

      // FCM token al
      _fcmToken = await _messaging.getToken();
      if (_fcmToken != null) {
        AppLogger.info('📱 FCM Token alındı: ${_fcmToken!.substring(0, 20)}...');
        await _sendTokenToServer(_fcmToken!);
      }

      // Token yenilendiğinde güncelle
      _messaging.onTokenRefresh.listen((newToken) {
        _fcmToken = newToken;
        AppLogger.info('🔄 FCM Token yenilendi');
        _sendTokenToServer(newToken);
      });

      // Foreground mesajları için handler
      FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

      // Background'da mesaj geldiğinde handler
      FirebaseMessaging.onMessageOpenedApp.listen(_handleBackgroundMessage);

      // Uygulama kapalıyken mesaj geldiğinde kontrol et
      RemoteMessage? initialMessage = await _messaging.getInitialMessage();
      if (initialMessage != null) {
        _handleBackgroundMessage(initialMessage);
      }

      _initialized = true;
    } catch (e) {
      AppLogger.error('❌ NotificationService initialize hatası: $e');
    }
  }

  /// FCM token'ı backend'e gönderir
  Future<void> _sendTokenToServer(String token) async {
    try {
      final authService = AuthService.instance;
      final user = authService.getCurrentFirebaseUser();
      
      if (user == null) {
        AppLogger.warning('⚠️ Kullanıcı giriş yapmamış, FCM token gönderilmedi');
        return;
      }

      // Backend'e token gönder
      final apiDataSource = FavoriteApiDataSource();
      await apiDataSource.updateFcmToken(token);
      
      AppLogger.info('✅ FCM token backend\'e gönderildi');
    } catch (e) {
      AppLogger.error('❌ FCM token gönderme hatası: $e');
    }
  }

  /// Foreground mesaj handler
  void _handleForegroundMessage(RemoteMessage message) {
    AppLogger.info('📨 Foreground mesaj alındı: ${message.notification?.title}');
    // Burada local notification gösterilebilir
    // Şimdilik sadece logluyoruz
  }

  /// Background mesaj handler (uygulama açıkken mesaj geldiğinde)
  void _handleBackgroundMessage(RemoteMessage message) {
    AppLogger.info('📨 Background mesaj alındı: ${message.notification?.title}');
    // Burada navigation yapılabilir
    // Şimdilik sadece logluyoruz
  }

  /// FCM token'ı getirir
  String? get fcmToken => _fcmToken;

  /// Token'ı yeniler ve backend'e gönderir
  Future<void> refreshToken() async {
    try {
      _fcmToken = await _messaging.getToken();
      if (_fcmToken != null) {
        await _sendTokenToServer(_fcmToken!);
      }
    } catch (e) {
      AppLogger.error('❌ Token yenileme hatası: $e');
    }
  }

  /// Bildirimleri devre dışı bırakır
  Future<void> disableNotifications() async {
    try {
      await _messaging.deleteToken();
      _fcmToken = null;
      AppLogger.info('🔕 Bildirimler devre dışı bırakıldı');
    } catch (e) {
      AppLogger.error('❌ Bildirim devre dışı bırakma hatası: $e');
    }
  }
}

/// Background message handler (top-level function)
/// Bu fonksiyon uygulama kapalıyken mesaj geldiğinde çağrılır
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  if (kDebugMode) {
    print('📨 Background mesaj alındı: ${message.notification?.title}');
  }
  // Burada gerekli işlemler yapılabilir
}
