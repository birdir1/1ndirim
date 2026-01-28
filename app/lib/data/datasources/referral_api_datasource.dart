import 'package:dio/dio.dart';
import '../../core/config/api_config.dart';
import '../../core/services/auth_service.dart';
import '../models/referral_stats_model.dart';

/// Referans API Data Source
class ReferralApiDataSource {
  final Dio _dio;
  final AuthService _authService = AuthService();

  ReferralApiDataSource({Dio? dio})
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
      throw Exception('Giriş yapmanız gerekiyor');
    }
    return {
      'Authorization': 'Bearer $token',
    };
  }

  /// Kullanıcının referans kodunu getirir veya oluşturur
  Future<String> getReferralCode() async {
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

      return response.data['data']['referralCode'] as String;
    } on DioException catch (e) {
      throw Exception('Referans kodu alınırken bir hata oluştu: ${e.message}');
    } catch (e) {
      throw Exception('Referans kodu alınırken bir hata oluştu: ${e.toString()}');
    }
  }

  /// Referans kodunu işler ve ödülleri verir
  Future<Map<String, dynamic>> processReferral(String referralCode) async {
    try {
      final headers = await _getAuthHeaders();
      final response = await _dio.post(
        '/api/referrals/process',
        data: {'referralCode': referralCode},
        options: Options(headers: headers),
      );

      if (response.statusCode != 200) {
        throw Exception('Sunucu hatası (${response.statusCode})');
      }

      if (response.data == null || response.data['success'] != true) {
        throw Exception('Geçersiz yanıt');
      }

      return response.data['data'] as Map<String, dynamic>;
    } on DioException catch (e) {
      if (e.response?.statusCode == 400) {
        final errorMessage = e.response?.data['error'] as String?;
        throw Exception(errorMessage ?? 'Geçersiz referans kodu');
      }
      throw Exception('Referans işlenirken bir hata oluştu: ${e.message}');
    } catch (e) {
      throw Exception('Referans işlenirken bir hata oluştu: ${e.toString()}');
    }
  }

  /// Kullanıcının referans istatistiklerini getirir
  Future<ReferralStatsModel> getReferralStats() async {
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
      throw Exception('Referans istatistikleri alınırken bir hata oluştu: ${e.message}');
    } catch (e) {
      throw Exception('Referans istatistikleri alınırken bir hata oluştu: ${e.toString()}');
    }
  }

  /// Referans kodunun geçerli olup olmadığını kontrol eder
  Future<bool> validateReferralCode(String code) async {
    try {
      final headers = await _getAuthHeaders();
      final response = await _dio.get(
        '/api/referrals/validate/$code',
        options: Options(headers: headers),
      );

      if (response.statusCode != 200) {
        return false;
      }

      if (response.data == null || response.data['success'] != true) {
        return false;
      }

      return response.data['data']['valid'] as bool? ?? false;
    } catch (e) {
      return false;
    }
  }
}
