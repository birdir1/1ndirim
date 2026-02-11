import 'dart:math';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';
import 'dio_error_interceptor.dart';

class _DeviceIdProvider {
  static const _prefsKey = 'device_id';
  static String? _cached;

  static Future<String> get() async {
    if (_cached != null) return _cached!;

    final prefs = await SharedPreferences.getInstance();
    final existing = prefs.getString(_prefsKey);
    if (existing != null && existing.isNotEmpty) {
      _cached = existing;
      return existing;
    }

    final random = Random.secure();
    final generated =
        'dev-${DateTime.now().millisecondsSinceEpoch}-${random.nextInt(1 << 32)}';
    await prefs.setString(_prefsKey, generated);
    _cached = generated;
    return generated;
  }
}

/// Singleton Dio client with error handling
class DioClient {
  static final DioClient _instance = DioClient._internal();
  factory DioClient() => _instance;

  late final Dio dio;

  DioClient._internal() {
    dio = Dio(
      BaseOptions(
        baseUrl: ApiConfig.baseUrl,
        connectTimeout: ApiConfig.connectTimeout,
        receiveTimeout: ApiConfig.receiveTimeout,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    // Enrich requests with stable device id for rate limit bucketing.
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          try {
            final deviceId = await _DeviceIdProvider.get();
            options.headers['X-Device-Id'] = deviceId;
          } catch (_) {
            // Sessizce devam et: header eklenemese de istek çalışsın.
          }
          handler.next(options);
        },
      ),
    );

    // Add error interceptor
    dio.interceptors.add(DioErrorInterceptor());

    // Verbose network logs only in debug builds.
    if (kDebugMode) {
      dio.interceptors.add(
        LogInterceptor(
          requestBody: true,
          responseBody: true,
          error: true,
          logPrint: (obj) => debugPrint('$obj'),
        ),
      );
    }
  }

  /// Get configured Dio instance
  static Dio get instance => _instance.dio;
}
