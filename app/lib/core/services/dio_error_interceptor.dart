import 'package:dio/dio.dart';
import '../utils/error_handler.dart';
import 'crashlytics_service.dart';

/// Dio interceptor for centralized error handling
class DioErrorInterceptor extends Interceptor {
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    // Log to Crashlytics
    CrashlyticsService.recordError(err, err.stackTrace);

    // Convert DioException to AppException
    final appException = _convertDioException(err);

    // Pass the converted exception
    handler.reject(
      DioException(
        requestOptions: err.requestOptions,
        error: appException,
        type: err.type,
        response: err.response,
      ),
    );
  }

  AppException _convertDioException(DioException error) {
    // Connection timeout
    if (error.type == DioExceptionType.connectionTimeout ||
        error.type == DioExceptionType.receiveTimeout ||
        error.type == DioExceptionType.sendTimeout) {
      return ErrorHandler.parseNetworkError(error);
    }

    // Connection error (no internet, server down)
    if (error.type == DioExceptionType.connectionError) {
      return NetworkException(
        'Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edin.',
        code: 'CONNECTION_ERROR',
        originalError: error,
      );
    }

    // HTTP error response
    if (error.response != null) {
      final statusCode = error.response!.statusCode ?? 0;
      final message = _extractErrorMessage(error.response!);
      return ErrorHandler.parseHttpError(statusCode, message);
    }

    // Cancel error
    if (error.type == DioExceptionType.cancel) {
      return NetworkException(
        'İstek iptal edildi.',
        code: 'CANCELLED',
        originalError: error,
      );
    }

    // Unknown error
    return NetworkException(
      'Bağlantı hatası. Lütfen tekrar deneyin.',
      code: 'UNKNOWN',
      originalError: error,
    );
  }

  String? _extractErrorMessage(Response response) {
    try {
      if (response.data is Map) {
        final data = response.data as Map<String, dynamic>;
        return data['error'] as String? ?? data['message'] as String?;
      }
    } catch (e) {
      // Ignore parsing errors
    }
    return null;
  }
}
