import 'package:dio/dio.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../core/config/api_config.dart';
import '../models/comment_model.dart';

/// Comment API Data Source
/// Backend API'den yorum işlemlerini yönetir
class CommentApiDataSource {
  final Dio _dio;
  FirebaseAuth? get _firebaseAuth {
    try {
      return FirebaseAuth.instance;
    } catch (_) {
      return null;
    }
  }

  CommentApiDataSource({Dio? dio})
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

  /// Bir kampanyanın yorumlarını getirir
  Future<List<CommentModel>> getComments({
    required String campaignId,
    int? limit,
    int? offset,
  }) async {
    try {
      final token = await _getAuthToken();
      final headers = <String, String>{};
      if (token != null) {
        headers['Authorization'] = 'Bearer $token';
      }

      final queryParams = <String, dynamic>{};
      if (limit != null) queryParams['limit'] = limit;
      if (offset != null) queryParams['offset'] = offset;

      final response = await _dio.get(
        '/api/comments/$campaignId',
        queryParameters: queryParams,
        options: Options(headers: headers),
      );

      if (response.statusCode == 200 && response.data['success'] == true) {
        final data = response.data['data'] as List;
        return data.map((item) => CommentModel.fromMap(item as Map<String, dynamic>)).toList();
      }

      throw Exception('Yorumlar getirilemedi');
    } on DioException catch (e) {
      if (e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.receiveTimeout) {
        throw Exception('Bağlantı zaman aşımı. Lütfen internet bağlantınızı kontrol edin.');
      } else if (e.response?.statusCode == 404) {
        throw Exception('Kampanya bulunamadı');
      } else if (e.response?.statusCode == 500) {
        throw Exception('Sunucu hatası. Lütfen daha sonra tekrar deneyin.');
      }
      throw Exception('Yorumlar getirilemedi: ${e.message}');
    } catch (e) {
      throw Exception('Yorumlar getirilemedi: ${e.toString()}');
    }
  }

  /// Bir kampanyaya yorum ekler
  Future<CommentModel> addComment({
    required String campaignId,
    required String commentText,
  }) async {
    try {
      final options = await _getAuthOptions();
      final response = await _dio.post(
        '/api/comments/$campaignId',
        data: {'commentText': commentText},
        options: options,
      );

      if (response.statusCode == 201 && response.data['success'] == true) {
        final data = response.data['data'] as Map<String, dynamic>;
        return CommentModel.fromMap(data);
      }

      throw Exception('Yorum eklenemedi');
    } on DioException catch (e) {
      if (e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.receiveTimeout) {
        throw Exception('Bağlantı zaman aşımı. Lütfen internet bağlantınızı kontrol edin.');
      } else if (e.response?.statusCode == 400) {
        final error = e.response?.data['error'] as String?;
        throw Exception(error ?? 'Geçersiz yorum metni');
      } else if (e.response?.statusCode == 401) {
        throw Exception('Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.');
      } else if (e.response?.statusCode == 404) {
        throw Exception('Kampanya bulunamadı');
      } else if (e.response?.statusCode == 500) {
        throw Exception('Sunucu hatası. Lütfen daha sonra tekrar deneyin.');
      }
      throw Exception('Yorum eklenemedi: ${e.message}');
    } catch (e) {
      throw Exception('Yorum eklenemedi: ${e.toString()}');
    }
  }

  /// Bir yorumu günceller
  Future<CommentModel> updateComment({
    required String commentId,
    required String commentText,
  }) async {
    try {
      final options = await _getAuthOptions();
      final response = await _dio.put(
        '/api/comments/$commentId',
        data: {'commentText': commentText},
        options: options,
      );

      if (response.statusCode == 200 && response.data['success'] == true) {
        final data = response.data['data'] as Map<String, dynamic>;
        return CommentModel.fromMap(data);
      }

      throw Exception('Yorum güncellenemedi');
    } on DioException catch (e) {
      if (e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.receiveTimeout) {
        throw Exception('Bağlantı zaman aşımı. Lütfen internet bağlantınızı kontrol edin.');
      } else if (e.response?.statusCode == 400) {
        final error = e.response?.data['error'] as String?;
        throw Exception(error ?? 'Geçersiz yorum metni');
      } else if (e.response?.statusCode == 401) {
        throw Exception('Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.');
      } else if (e.response?.statusCode == 403) {
        throw Exception('Bu yorumu düzenleme yetkiniz yok');
      } else if (e.response?.statusCode == 404) {
        throw Exception('Yorum bulunamadı');
      } else if (e.response?.statusCode == 500) {
        throw Exception('Sunucu hatası. Lütfen daha sonra tekrar deneyin.');
      }
      throw Exception('Yorum güncellenemedi: ${e.message}');
    } catch (e) {
      throw Exception('Yorum güncellenemedi: ${e.toString()}');
    }
  }

  /// Bir yorumu siler
  Future<void> deleteComment(String commentId) async {
    try {
      final options = await _getAuthOptions();
      await _dio.delete(
        '/api/comments/$commentId',
        options: options,
      );
    } on DioException catch (e) {
      if (e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.receiveTimeout) {
        throw Exception('Bağlantı zaman aşımı. Lütfen internet bağlantınızı kontrol edin.');
      } else if (e.response?.statusCode == 401) {
        throw Exception('Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.');
      } else if (e.response?.statusCode == 403) {
        throw Exception('Bu yorumu silme yetkiniz yok');
      } else if (e.response?.statusCode == 404) {
        throw Exception('Yorum bulunamadı');
      } else if (e.response?.statusCode == 500) {
        throw Exception('Sunucu hatası. Lütfen daha sonra tekrar deneyin.');
      }
      throw Exception('Yorum silinemedi: ${e.message}');
    } catch (e) {
      throw Exception('Yorum silinemedi: ${e.toString()}');
    }
  }
}
