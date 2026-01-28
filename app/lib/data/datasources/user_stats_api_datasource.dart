import 'package:dio/dio.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../core/config/api_config.dart';
import '../models/user_stats_model.dart';

/// User Stats API Data Source
/// Backend API'den kullanıcı istatistiklerini yönetir
class UserStatsApiDataSource {
  final Dio _dio;
  final FirebaseAuth _firebaseAuth = FirebaseAuth.instance;

  UserStatsApiDataSource({Dio? dio})
      : _dio = dio ??
            Dio(BaseOptions(
              baseUrl: ApiConfig.baseUrl,
              connectTimeout: ApiConfig.connectTimeout,
              receiveTimeout: ApiConfig.receiveTimeout,
            ));

  /// Firebase token'ı alır
  Future<String?> _getAuthToken() async {
    try {
      final user = _firebaseAuth.currentUser;
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

  /// Kullanıcı istatistiklerini getirir
  Future<UserStatsModel> getUserStats() async {
    try {
      final options = await _getAuthOptions();
      final response = await _dio.get(
        '/api/users/stats',
        options: options,
      );

      if (response.statusCode == 200 && response.data['success'] == true) {
        final data = response.data['data'] as Map<String, dynamic>;
        return UserStatsModel.fromMap(data);
      }

      throw Exception('İstatistikler getirilemedi');
    } on DioException catch (e) {
      if (e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.receiveTimeout) {
        throw Exception('Bağlantı zaman aşımı. Lütfen internet bağlantınızı kontrol edin.');
      } else if (e.response?.statusCode == 401) {
        throw Exception('Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.');
      } else if (e.response?.statusCode == 500) {
        throw Exception('Sunucu hatası. Lütfen daha sonra tekrar deneyin.');
      }
      throw Exception('İstatistikler getirilemedi: ${e.message}');
    } catch (e) {
      throw Exception('İstatistikler getirilemedi: ${e.toString()}');
    }
  }
}
