import 'package:flutter/material.dart';
import '../services/crashlytics_service.dart';

/// Custom exception types
class AppException implements Exception {
  final String message;
  final String? code;
  final dynamic originalError;

  AppException(this.message, {this.code, this.originalError});

  @override
  String toString() => message;
}

class NetworkException extends AppException {
  NetworkException(super.message, {super.code, super.originalError});
}

class AuthException extends AppException {
  AuthException(super.message, {super.code, super.originalError});
}

class ValidationException extends AppException {
  ValidationException(super.message, {super.code, super.originalError});
}

class ServerException extends AppException {
  ServerException(super.message, {super.code, super.originalError});
}

/// Global error handler
class ErrorHandler {
  static final ErrorHandler _instance = ErrorHandler._internal();
  factory ErrorHandler() => _instance;
  ErrorHandler._internal();

  /// Handle error and return user-friendly message
  static String handleError(dynamic error, {StackTrace? stackTrace}) {
    String userMessage;

    // Log to Crashlytics
    CrashlyticsService.recordError(error, stackTrace);

    // Determine user-friendly message
    if (error is NetworkException) {
      userMessage = error.message;
    } else if (error is AuthException) {
      userMessage = error.message;
    } else if (error is ValidationException) {
      userMessage = error.message;
    } else if (error is ServerException) {
      userMessage = error.message;
    } else if (error is AppException) {
      userMessage = error.message;
    } else {
      userMessage = 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.';
    }

    return userMessage;
  }

  /// Show error snackbar
  static void showErrorSnackBar(
    BuildContext context,
    dynamic error, {
    StackTrace? stackTrace,
  }) {
    final message = handleError(error, stackTrace: stackTrace);

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red[700],
        behavior: SnackBarBehavior.floating,
        action: SnackBarAction(
          label: 'Tamam',
          textColor: Colors.white,
          onPressed: () {
            ScaffoldMessenger.of(context).hideCurrentSnackBar();
          },
        ),
      ),
    );
  }

  /// Show error dialog
  static Future<void> showErrorDialog(
    BuildContext context,
    dynamic error, {
    StackTrace? stackTrace,
    String? title,
    VoidCallback? onRetry,
  }) async {
    final message = handleError(error, stackTrace: stackTrace);

    return showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title ?? 'Hata'),
        content: Text(message),
        actions: [
          if (onRetry != null)
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
                onRetry();
              },
              child: const Text('Tekrar Dene'),
            ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Tamam'),
          ),
        ],
      ),
    );
  }

  /// Parse HTTP error
  static AppException parseHttpError(int statusCode, String? message) {
    switch (statusCode) {
      case 400:
        return ValidationException(
          message ?? 'Geçersiz istek. Lütfen bilgilerinizi kontrol edin.',
          code: 'BAD_REQUEST',
        );
      case 401:
        return AuthException(
          message ?? 'Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.',
          code: 'UNAUTHORIZED',
        );
      case 403:
        return AuthException(
          message ?? 'Bu işlem için yetkiniz yok.',
          code: 'FORBIDDEN',
        );
      case 404:
        return ServerException(
          message ?? 'İstediğiniz kaynak bulunamadı.',
          code: 'NOT_FOUND',
        );
      case 409:
        return ValidationException(
          message ?? 'Bu işlem zaten yapılmış.',
          code: 'CONFLICT',
        );
      case 429:
        return NetworkException(
          message ?? 'Çok fazla istek gönderdiniz. Lütfen biraz bekleyin.',
          code: 'TOO_MANY_REQUESTS',
        );
      case 500:
      case 502:
      case 503:
      case 504:
        return ServerException(
          message ?? 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.',
          code: 'SERVER_ERROR',
        );
      default:
        return ServerException(
          message ?? 'Bir hata oluştu. Lütfen tekrar deneyin.',
          code: 'UNKNOWN_ERROR',
        );
    }
  }

  /// Parse network error
  static NetworkException parseNetworkError(dynamic error) {
    if (error.toString().contains('SocketException') ||
        error.toString().contains('Failed host lookup')) {
      return NetworkException(
        'İnternet bağlantınızı kontrol edin.',
        code: 'NO_INTERNET',
        originalError: error,
      );
    } else if (error.toString().contains('TimeoutException')) {
      return NetworkException(
        'İstek zaman aşımına uğradı. Lütfen tekrar deneyin.',
        code: 'TIMEOUT',
        originalError: error,
      );
    } else {
      return NetworkException(
        'Bağlantı hatası. Lütfen tekrar deneyin.',
        code: 'CONNECTION_ERROR',
        originalError: error,
      );
    }
  }
}
