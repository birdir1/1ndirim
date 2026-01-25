/// Network Result - API çağrıları için generic result wrapper
/// Success, Error ve Loading state'lerini yönetir
sealed class NetworkResult<T> {
  const NetworkResult();
}

/// Başarılı sonuç
class NetworkSuccess<T> extends NetworkResult<T> {
  final T data;

  const NetworkSuccess(this.data);
}

/// Hata sonucu
class NetworkError<T> extends NetworkResult<T> {
  final String message;
  final int? statusCode;
  final dynamic error;

  const NetworkError({
    required this.message,
    this.statusCode,
    this.error,
  });

  /// Network hatası (internet bağlantısı yok)
  factory NetworkError.offline() {
    return const NetworkError(
      message: 'İnternet bağlantısı yok. Lütfen bağlantınızı kontrol edin.',
    );
  }

  /// Server hatası
  factory NetworkError.server(String message, {int? statusCode}) {
    return NetworkError(
      message: message,
      statusCode: statusCode,
    );
  }

  /// Genel hata
  factory NetworkError.general(String message, {dynamic error}) {
    return NetworkError(
      message: message,
      error: error,
    );
  }
}

/// Yükleniyor durumu
class NetworkLoading<T> extends NetworkResult<T> {
  const NetworkLoading();
}
