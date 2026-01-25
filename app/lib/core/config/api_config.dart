import 'package:flutter/foundation.dart';

/// Environment enum
enum Environment {
  development,
  production,
}

/// API Configuration
/// Environment-based configuration (dev/prod)
class ApiConfig {
  /// Current environment (compile-time constant)
  /// kDebugMode: true in debug, false in release/profile
  /// Production için: flutter build --release kullanıldığında kDebugMode = false
  static const Environment _currentEnvironment =
      kDebugMode ? Environment.development : Environment.production;

  /// Development API Base URL
  /// iOS cihazda localhost çalışmaz, bilgisayarın IP adresini kullan
  /// Mac IP adresi: 192.168.0.2 (otomatik bulundu)
  /// 
  /// IP adresi değişirse bu değeri güncelleyin:
  /// Terminal: ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}'
  static const String _devBaseUrl = 'http://192.168.0.2:3000/api';

  /// Production API Base URL
  /// Production domain belirlendiğinde buraya eklenecek
  /// Örnek: 'https://api.1ndirim.com/api'
  static const String _prodBaseUrl = 'https://api.1ndirim.com/api';

  /// Base URL getter (environment-based)
  static String get baseUrl {
    switch (_currentEnvironment) {
      case Environment.development:
        return _devBaseUrl;
      case Environment.production:
        return _prodBaseUrl;
    }
  }

  /// Current environment getter (debugging için)
  static Environment get environment => _currentEnvironment;

  /// Is development mode?
  static bool get isDevelopment => _currentEnvironment == Environment.development;

  /// Is production mode?
  static bool get isProduction => _currentEnvironment == Environment.production;

  // Endpoints
  static const String campaigns = '/campaigns';
  static const String sources = '/sources';
  static const String health = '/health';

  // Timeout
  static const Duration connectTimeout = Duration(seconds: 10);
  static const Duration receiveTimeout = Duration(seconds: 10);
}
