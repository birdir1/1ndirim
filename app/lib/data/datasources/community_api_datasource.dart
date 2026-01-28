import 'package:dio/dio.dart';
import '../../core/config/api_config.dart';
import '../../core/services/auth_service.dart';
import '../models/leaderboard_model.dart';
import '../models/community_stats_model.dart';

/// Community API Data Source
class CommunityApiDataSource {
  final Dio _dio;
  final AuthService _authService = AuthService.instance;

  CommunityApiDataSource({Dio? dio})
      : _dio = dio ??
            Dio(BaseOptions(
              baseUrl: ApiConfig.baseUrl,
              connectTimeout: ApiConfig.connectTimeout,
              receiveTimeout: ApiConfig.receiveTimeout,
            ));

  /// Auth header'ları alır (opsiyonel - giriş yapmamış kullanıcılar da görebilir)
  Future<Map<String, String>> _getAuthHeaders() async {
    final token = await _authService.getIdToken();
    if (token == null) {
      return {}; // Giriş yapmamış kullanıcılar için boş header
    }
    return {
      'Authorization': 'Bearer $token',
    };
  }

  /// Leaderboard'u getirir
  Future<List<LeaderboardModel>> getLeaderboard({int limit = 10}) async {
    try {
      final headers = await _getAuthHeaders();
      final response = await _dio.get(
        '/api/community/leaderboard',
        queryParameters: {'limit': limit},
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

      return data
          .map((item) => LeaderboardModel.fromMap(item as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw Exception('Leaderboard yüklenirken bir hata oluştu: ${e.message}');
    } catch (e) {
      throw Exception('Leaderboard yüklenirken bir hata oluştu: ${e.toString()}');
    }
  }

  /// Topluluk istatistiklerini getirir
  Future<CommunityStatsModel> getCommunityStats() async {
    try {
      final headers = await _getAuthHeaders();
      final response = await _dio.get(
        '/api/community/stats',
        options: Options(headers: headers),
      );

      if (response.statusCode != 200) {
        throw Exception('Sunucu hatası (${response.statusCode})');
      }

      if (response.data == null || response.data['success'] != true) {
        throw Exception('Geçersiz yanıt');
      }

      return CommunityStatsModel.fromMap(response.data['data']);
    } on DioException catch (e) {
      throw Exception('Topluluk istatistikleri yüklenirken bir hata oluştu: ${e.message}');
    } catch (e) {
      throw Exception('Topluluk istatistikleri yüklenirken bir hata oluştu: ${e.toString()}');
    }
  }
}
