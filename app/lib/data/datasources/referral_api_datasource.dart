import 'package:dio/dio.dart';
import '../../core/config/api_config.dart';
import '../../core/services/auth_service.dart';
import '../models/referral_code_model.dart';
import '../models/referral_stats_model.dart';

/// Referral API Data Source
class ReferralApiDataSource {
  final Dio _dio;
  final AuthService _authService = AuthService.instance;

  ReferralApiDataSource({Dio? dio})
    : _dio =
          dio ??
          Dio(
            BaseOptions(
              baseUrl: ApiConfig.baseUrl,
              connectTimeout: ApiConfig.connectTimeout,
              receiveTimeout: ApiConfig.receiveTimeout,
            ),
          );

  /// Auth header'ları alır
  Future<Map<String, String>> _getAuthHeaders() async {
    final token = await _authService.getIdToken();
    if (token == null) {
      throw Exception('Kullanıcı giriş yapmamış');
    }
    return {'Authorization': 'Bearer $token'};
  }

  /// Kullanıcının referral kodunu getirir
  Future<ReferralCodeModel> getReferralCode() async {
    try {
      final headers = await _getAuthHeaders();
      final response = await _dio.get(
        '/api/referrals/code',
        options: Options(headers: headers),
      );

      if (response.statusCode != 200) {
        throw Exception('Sunucu hatası (${response.statusCode})');
      }

      if (response.data == null || response.data['success'] != true) {
        throw Exception('Geçersiz yanıt');
      }

      return ReferralCodeModel.fromMap(response.data['data']);
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) {
        throw Exception('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.');
      }
      throw Exception('Referral kodu alınırken bir hata oluştu: ${e.message}');
    } catch (e) {
      throw Exception(
        'Referral kodu alınırken bir hata oluştu: ${e.toString()}',
      );
    }
  }

  /// Referral kodunu uygular
  Future<void> applyReferralCode(String code) async {
    try {
      final headers = await _getAuthHeaders();
      final response = await _dio.post(
        '/api/referrals/process',
        data: {'referralCode': code},
        options: Options(headers: headers),
      );

      if (response.statusCode != 200) {
        throw Exception('Sunucu hatası (${response.statusCode})');
      }

      if (response.data == null || response.data['success'] != true) {
        throw Exception(response.data?['error'] ?? 'Geçersiz yanıt');
      }
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) {
        throw Exception('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.');
      }
      if (e.response?.statusCode == 400) {
        throw Exception(e.response?.data?['error'] ?? 'Geçersiz referral kodu');
      }
      throw Exception(
        'Referral kodu uygulanırken bir hata oluştu: ${e.message}',
      );
    } catch (e) {
      throw Exception(
        'Referral kodu uygulanırken bir hata oluştu: ${e.toString()}',
      );
    }
  }

  /// Kullanıcının referral istatistiklerini getirir
  Future<ReferralStatsModel> getStats() async {
    try {
      final headers = await _getAuthHeaders();
      final response = await _dio.get(
        '/api/referrals/stats',
        options: Options(headers: headers),
      );

      if (response.statusCode != 200) {
        throw Exception('Sunucu hatası (${response.statusCode})');
      }

      if (response.data == null || response.data['success'] != true) {
        throw Exception('Geçersiz yanıt');
      }

      return ReferralStatsModel.fromMap(response.data['data']);
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) {
        throw Exception('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.');
      }
      throw Exception('İstatistikler alınırken bir hata oluştu: ${e.message}');
    } catch (e) {
      throw Exception(
        'İstatistikler alınırken bir hata oluştu: ${e.toString()}',
      );
    }
  }

  /// Referral kodunu validate eder
  Future<bool> validateCode(String code) async {
    try {
      final response = await _dio.get('/api/referrals/validate/$code');

      if (response.statusCode != 200) {
        return false;
      }

      if (response.data == null || response.data['success'] != true) {
        return false;
      }

      return response.data['data']['valid'] == true;
    } catch (e) {
      return false;
    }
  }
}
