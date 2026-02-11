import 'dart:async';
import 'dart:math';
import 'dart:io' show Platform;

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

    // Prevent request storms for high-traffic read endpoints.
    // Widget/unit tests run with a fake HttpClient and should keep network behavior unchanged.
    if (!Platform.environment.containsKey('FLUTTER_TEST')) {
      dio.interceptors.add(_RequestStormGuardInterceptor());
    }

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

class _RequestStormGuardInterceptor extends Interceptor {
  static const _extraKey = '_storm_guard_key';
  static final Map<String, Completer<Response<dynamic>>> _inFlight = {};
  static final Map<String, _CachedResponse> _cache = {};

  bool _isGuardedGet(RequestOptions options) {
    if (options.method.toUpperCase() != 'GET') return false;
    final path = options.path;
    return path.endsWith('/favorites') ||
        path.endsWith('/campaigns/all') ||
        path.endsWith('/campaigns');
  }

  Duration _ttlForPath(String path) {
    if (path.endsWith('/favorites')) {
      return const Duration(seconds: 2);
    }
    if (path.endsWith('/campaigns/all') || path.endsWith('/campaigns')) {
      return const Duration(seconds: 3);
    }
    return const Duration(seconds: 1);
  }

  String _buildKey(RequestOptions options) {
    final path = options.path;
    final query = options.queryParameters.entries.toList()
      ..sort((a, b) => a.key.compareTo(b.key));
    final queryPart = query.map((e) => '${e.key}=${e.value}').join('&');
    final auth = options.headers['Authorization']?.toString() ?? '';
    final authSuffix = auth.length > 16 ? auth.substring(auth.length - 16) : auth;
    return '${options.method}|$path|$queryPart|$authSuffix';
  }

  Response<dynamic> _cloneResponse(
    Response<dynamic> source,
    RequestOptions requestOptions,
  ) {
    return Response<dynamic>(
      requestOptions: requestOptions,
      data: source.data,
      headers: source.headers,
      isRedirect: source.isRedirect,
      redirects: source.redirects,
      statusCode: source.statusCode,
      statusMessage: source.statusMessage,
      extra: Map<String, dynamic>.from(source.extra),
    );
  }

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    if (!_isGuardedGet(options) || options.extra['skipStormGuard'] == true) {
      handler.next(options);
      return;
    }

    final key = _buildKey(options);
    final now = DateTime.now();
    final cached = _cache[key];
    if (cached != null) {
      final ttl = _ttlForPath(options.path);
      if (now.difference(cached.createdAt) <= ttl) {
        handler.resolve(_cloneResponse(cached.response, options));
        return;
      }
      _cache.remove(key);
    }

    final inFlight = _inFlight[key];
    if (inFlight != null) {
      try {
        final response = await inFlight.future;
        handler.resolve(_cloneResponse(response, options));
      } catch (error) {
        if (error is DioException) {
          handler.reject(error.copyWith(requestOptions: options));
        } else {
          handler.reject(
            DioException(
              requestOptions: options,
              error: error,
              type: DioExceptionType.unknown,
            ),
          );
        }
      }
      return;
    }

    final completer = Completer<Response<dynamic>>();
    _inFlight[key] = completer;
    options.extra[_extraKey] = key;
    handler.next(options);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    final key = response.requestOptions.extra[_extraKey]?.toString();
    if (key != null) {
      _inFlight.remove(key)?.complete(response);
      _cache[key] = _CachedResponse(
        response: response,
        createdAt: DateTime.now(),
      );
    }
    handler.next(response);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    final key = err.requestOptions.extra[_extraKey]?.toString();
    if (key != null) {
      _inFlight.remove(key)?.completeError(err);
    }
    handler.next(err);
  }
}

class _CachedResponse {
  final Response<dynamic> response;
  final DateTime createdAt;

  const _CachedResponse({
    required this.response,
    required this.createdAt,
  });
}
