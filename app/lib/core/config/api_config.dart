import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

/// Environment enum
enum Environment { development, production }

/// API Configuration
/// Environment-based configuration (dev/prod)
class ApiConfig {
  /// Current environment (compile-time constant)
  /// kDebugMode: true in debug, false in release/profile
  /// Production için: flutter build --release kullanıldığında kDebugMode = false
  static const Environment _currentEnvironment = kDebugMode
      ? Environment.development
      : Environment.production;

  /// Base URL from .env file (fallback to hardcoded if not found)
  static String get baseUrl {
    final envUrl = dotenv.env['API_BASE_URL'];
    if (envUrl != null && envUrl.isNotEmpty) {
      return envUrl;
    }

    // Fallback to hardcoded URLs
    switch (_currentEnvironment) {
      case Environment.development:
        return 'https://api.1indirim.birdir1.com/api';
      case Environment.production:
        return 'https://api.1indirim.birdir1.com/api';
    }
  }

  /// Current environment getter (debugging için)
  static Environment get environment => _currentEnvironment;

  /// Is development mode?
  static bool get isDevelopment =>
      _currentEnvironment == Environment.development;

  /// Is production mode?
  static bool get isProduction => _currentEnvironment == Environment.production;

  // Endpoints
  static const String campaigns = '/campaigns';
  static const String sources = '/sources';
  static const String health = '/health';

  // Timeout
  // Mobile networks can be slow, and `/campaigns/all` responses can be large.
  static const Duration connectTimeout = Duration(seconds: 20);
  static const Duration receiveTimeout = Duration(seconds: 30);
}
