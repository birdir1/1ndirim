import 'package:flutter_test/flutter_test.dart';
import 'package:indirim_app/core/utils/error_handler.dart';

void main() {
  group('ErrorHandler', () {
    test('handleError returns correct message for NetworkException', () {
      final error = NetworkException('İnternet bağlantınızı kontrol edin.');
      final message = ErrorHandler.handleError(error);

      expect(message, 'İnternet bağlantınızı kontrol edin.');
    });

    test('handleError returns correct message for AuthException', () {
      final error = AuthException('Oturum süreniz dolmuş.');
      final message = ErrorHandler.handleError(error);

      expect(message, 'Oturum süreniz dolmuş.');
    });

    test('handleError returns correct message for ValidationException', () {
      final error = ValidationException('Geçersiz istek.');
      final message = ErrorHandler.handleError(error);

      expect(message, 'Geçersiz istek.');
    });

    test('handleError returns correct message for ServerException', () {
      final error = ServerException('Sunucu hatası.');
      final message = ErrorHandler.handleError(error);

      expect(message, 'Sunucu hatası.');
    });

    test('handleError returns generic message for unknown error', () {
      final error = Exception('Unknown error');
      final message = ErrorHandler.handleError(error);

      expect(message, 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.');
    });

    test('parseHttpError returns ValidationException for 400', () {
      final error = ErrorHandler.parseHttpError(400, null);

      expect(error, isA<ValidationException>());
      expect(error.code, 'BAD_REQUEST');
    });

    test('parseHttpError returns AuthException for 401', () {
      final error = ErrorHandler.parseHttpError(401, null);

      expect(error, isA<AuthException>());
      expect(error.code, 'UNAUTHORIZED');
    });

    test('parseHttpError returns AuthException for 403', () {
      final error = ErrorHandler.parseHttpError(403, null);

      expect(error, isA<AuthException>());
      expect(error.code, 'FORBIDDEN');
    });

    test('parseHttpError returns ServerException for 404', () {
      final error = ErrorHandler.parseHttpError(404, null);

      expect(error, isA<ServerException>());
      expect(error.code, 'NOT_FOUND');
    });

    test('parseHttpError returns ValidationException for 409', () {
      final error = ErrorHandler.parseHttpError(409, null);

      expect(error, isA<ValidationException>());
      expect(error.code, 'CONFLICT');
    });

    test('parseHttpError returns NetworkException for 429', () {
      final error = ErrorHandler.parseHttpError(429, null);

      expect(error, isA<NetworkException>());
      expect(error.code, 'TOO_MANY_REQUESTS');
    });

    test('parseHttpError returns ServerException for 500', () {
      final error = ErrorHandler.parseHttpError(500, null);

      expect(error, isA<ServerException>());
      expect(error.code, 'SERVER_ERROR');
    });

    test('parseHttpError uses custom message when provided', () {
      final error = ErrorHandler.parseHttpError(400, 'Custom error message');

      expect(error.message, 'Custom error message');
    });

    test('parseNetworkError detects no internet', () {
      final error = Exception('SocketException: Failed host lookup');
      final networkError = ErrorHandler.parseNetworkError(error);

      expect(networkError.code, 'NO_INTERNET');
      expect(networkError.message, 'İnternet bağlantınızı kontrol edin.');
    });

    test('parseNetworkError detects timeout', () {
      final error = Exception('TimeoutException after 10 seconds');
      final networkError = ErrorHandler.parseNetworkError(error);

      expect(networkError.code, 'TIMEOUT');
      expect(
        networkError.message,
        'İstek zaman aşımına uğradı. Lütfen tekrar deneyin.',
      );
    });
  });

  group('Custom Exceptions', () {
    test('NetworkException stores message and code', () {
      final error = NetworkException(
        'Network error',
        code: 'TEST_CODE',
        originalError: Exception('Original'),
      );

      expect(error.message, 'Network error');
      expect(error.code, 'TEST_CODE');
      expect(error.originalError, isA<Exception>());
    });

    test('AuthException stores message and code', () {
      final error = AuthException('Auth error', code: 'AUTH_CODE');

      expect(error.message, 'Auth error');
      expect(error.code, 'AUTH_CODE');
    });

    test('ValidationException stores message and code', () {
      final error = ValidationException(
        'Validation error',
        code: 'VALIDATION_CODE',
      );

      expect(error.message, 'Validation error');
      expect(error.code, 'VALIDATION_CODE');
    });

    test('ServerException stores message and code', () {
      final error = ServerException('Server error', code: 'SERVER_CODE');

      expect(error.message, 'Server error');
      expect(error.code, 'SERVER_CODE');
    });
  });
}
