import 'package:dio/dio.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../core/config/api_config.dart';
import '../models/rating_model.dart';

/// Rating API Data Source
/// Backend API'den puanlama işlemlerini yönetir
class RatingApiDataSource {
  final Dio _dio;
  FirebaseAuth? get _firebaseAuth {
    try {
      return FirebaseAuth.instance;
    } catch (_) {
      return null;
    }
  }

  RatingApiDataSource({Dio? dio})
      : _dio = dio ??
            Dio(BaseOptions(
              baseUrl: ApiConfig.baseUrl,
              connectTimeout: ApiConfig.connectTimeout,
              receiveTimeout: ApiConfig.receiveTimeout,
            ));

  /// Firebase token'ı alır
  Future<String?> _getAuthToken() async {
    try {
      final user = _firebaseAuth?.currentUser;
      if (user == null) {
        return null;
      }
      return await user.getIdToken();
    } catch (e) {
      return null;
    }
  }

  /// Authorization header'ı ekler
  Future<Options> _getAuthOptions() async {
    final token = await _getAuthToken();
    if (token == null) {
      throw Exception('Kullanıcı giriş yapmamış');
    }
    return Options(
      headers: {
        'Authorization': 'Bearer $token',
      },
    );
  }

  /// Bir kampanyanın puanlama istatistiklerini getirir
  Future<RatingModel> getRatingStats(String campaignId) async {
    try {
      final token = await _getAuthToken();
      final headers = <String, String>{};
      if (token != null) {
        headers['Authorization'] = 'Bearer $token';
      }

      final response = await _dio.get(
        '/api/ratings/$campaignId',
        options: Options(headers: headers),
      );

      if (response.statusCode == 200 && response.data['success'] == true) {
        final data = response.data['data'] as Map<String, dynamic>;
        return RatingModel.fromMap(data);
      }

      throw Exception('Puanlama istatistikleri getirilemedi');
    } on DioException catch (e) {
      if (e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.receiveTimeout) {
        throw Exception('Bağlantı zaman aşımı. Lütfen internet bağlantınızı kontrol edin.');
      } else if (e.response?.statusCode == 404) {
        throw Exception('Kampanya bulunamadı');
      } else if (e.response?.statusCode == 500) {
        throw Exception('Sunucu hatası. Lütfen daha sonra tekrar deneyin.');
      }
      throw Exception('Puanlama istatistikleri getirilemedi: ${e.message}');
    } catch (e) {
      throw Exception('Puanlama istatistikleri getirilemedi: ${e.toString()}');
    }
  }

  /// Bir kampanyaya puan verir veya günceller
  Future<void> submitRating({
    required String campaignId,
    required int rating, // 1-5 arası
  }) async {
    try {
      final options = await _getAuthOptions();
      await _dio.post(
        '/api/ratings/$campaignId',
        data: {'rating': rating},
        options: options,
      );
    } on DioException catch (e) {
      if (e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.receiveTimeout) {
        throw Exception('Bağlantı zaman aşımı. Lütfen internet bağlantınızı kontrol edin.');
      } else if (e.response?.statusCode == 400) {
        final error = e.response?.data['error'] as String?;
        throw Exception(error ?? 'Geçersiz puan');
      } else if (e.response?.statusCode == 401) {
        throw Exception('Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.');
      } else if (e.response?.statusCode == 404) {
        throw Exception('Kampanya bulunamadı');
      } else if (e.response?.statusCode == 500) {
        throw Exception('Sunucu hatası. Lütfen daha sonra tekrar deneyin.');
      }
      throw Exception('Puan verilemedi: ${e.message}');
    } catch (e) {
      throw Exception('Puan verilemedi: ${e.toString()}');
    }
  }

  /// Bir kampanyaya verilen puanı siler
  Future<void> deleteRating(String campaignId) async {
    try {
      final options = await _getAuthOptions();
      await _dio.delete(
        '/api/ratings/$campaignId',
        options: options,
      );
    } on DioException catch (e) {
      if (e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.receiveTimeout) {
        throw Exception('Bağlantı zaman aşımı. Lütfen internet bağlantınızı kontrol edin.');
      } else if (e.response?.statusCode == 401) {
        throw Exception('Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.');
      } else if (e.response?.statusCode == 404) {
        throw Exception('Puan bulunamadı');
      } else if (e.response?.statusCode == 500) {
        throw Exception('Sunucu hatası. Lütfen daha sonra tekrar deneyin.');
      }
      throw Exception('Puan silinemedi: ${e.message}');
    } catch (e) {
      throw Exception('Puan silinemedi: ${e.toString()}');
    }
  }
}
