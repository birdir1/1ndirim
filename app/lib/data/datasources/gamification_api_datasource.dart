import 'package:dio/dio.dart';
import '../../core/config/api_config.dart';
import '../../core/services/auth_service.dart';
import '../models/user_points_model.dart';
import '../models/user_badge_model.dart';

/// Gamification API Data Source
class GamificationApiDataSource {
  final Dio _dio;
  final AuthService _authService = AuthService.instance;

  GamificationApiDataSource({Dio? dio})
      : _dio = dio ??
            Dio(BaseOptions(
              baseUrl: ApiConfig.baseUrl,
              connectTimeout: ApiConfig.connectTimeout,
              receiveTimeout: ApiConfig.receiveTimeout,
            ));

  /// Auth header'ları alır
  Future<Map<String, String>> _getAuthHeaders() async {
    final token = await _authService.getIdToken();
    if (token == null) {
      throw Exception('Kullanıcı giriş yapmamış');
    }
    return {
      'Authorization': 'Bearer $token',
    };
  }

  /// Kullanıcının puanlarını getirir
  Future<UserPointsModel> getUserPoints() async {
    try {
      final headers = await _getAuthHeaders();
      final response = await _dio.get(
        '/api/users/points',
        options: Options(headers: headers),
      );

      if (response.statusCode != 200) {
        throw Exception('Sunucu hatası (${response.statusCode})');
      }

      if (response.data == null || response.data['success'] != true) {
        throw Exception('Geçersiz yanıt');
      }

      return UserPointsModel.fromMap(response.data['data']);
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) {
        throw Exception('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.');
      }
      throw Exception('Puanlar yüklenirken bir hata oluştu: ${e.message}');
    } catch (e) {
      throw Exception('Puanlar yüklenirken bir hata oluştu: ${e.toString()}');
    }
  }

  /// Kullanıcının rozetlerini getirir
  Future<List<UserBadgeModel>> getUserBadges() async {
    try {
      final headers = await _getAuthHeaders();
      final response = await _dio.get(
        '/api/users/badges',
        options: Options(headers: headers),
      );

      if (response.statusCode != 200) {
        throw Exception('Sunucu hatası (${response.statusCode})');
      }

      if (response.data == null || response.data['success'] != true) {
        throw Exception('Geçersiz yanıt');
      }

      final data = response.data['data'] as List?;
      if (data == null) {
        return [];
      }

      return data.map((item) => UserBadgeModel.fromMap(item as Map<String, dynamic>)).toList();
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) {
        throw Exception('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.');
      }
      throw Exception('Rozetler yüklenirken bir hata oluştu: ${e.message}');
    } catch (e) {
      throw Exception('Rozetler yüklenirken bir hata oluştu: ${e.toString()}');
    }
  }
}
