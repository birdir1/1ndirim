import 'package:dio/dio.dart';
import '../../core/config/api_config.dart';
import '../../core/services/auth_service.dart';
import '../models/premium_plan_model.dart';
import '../models/premium_feature_model.dart';

/// Premium API Data Source
class PremiumApiDataSource {
  final Dio _dio;
  final AuthService _authService = AuthService.instance;

  PremiumApiDataSource({Dio? dio})
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
      throw Exception('Giriş yapmanız gerekiyor');
    }
    return {'Authorization': 'Bearer $token'};
  }

  /// Kullanıcının premium durumunu kontrol eder
  Future<Map<String, dynamic>> getPremiumStatus() async {
    try {
      final headers = await _getAuthHeaders();
      final response = await _dio.get(
        '/api/premium/status',
        options: Options(headers: headers),
      );

      if (response.statusCode != 200) {
        throw Exception('Sunucu hatası (${response.statusCode})');
      }

      if (response.data == null || response.data['success'] != true) {
        throw Exception('Geçersiz yanıt');
      }

      return response.data['data'];
    } on DioException catch (e) {
      throw Exception(
        'Premium durum kontrol edilirken bir hata oluştu: ${e.message}',
      );
    } catch (e) {
      throw Exception(
        'Premium durum kontrol edilirken bir hata oluştu: ${e.toString()}',
      );
    }
  }

  /// Tüm premium planları getirir
  Future<List<PremiumPlanModel>> getPlans() async {
    try {
      final headers = await _getAuthHeaders();
      final response = await _dio.get(
        '/api/premium/plans',
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
          .map((item) => PremiumPlanModel.fromMap(item as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw Exception(
        'Premium planlar alınırken bir hata oluştu: ${e.message}',
      );
    } catch (e) {
      throw Exception(
        'Premium planlar alınırken bir hata oluştu: ${e.toString()}',
      );
    }
  }

  /// Premium özelliklerini getirir
  Future<List<PremiumFeatureModel>> getFeatures() async {
    try {
      final headers = await _getAuthHeaders();
      final response = await _dio.get(
        '/api/premium/features',
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
          .map(
            (item) => PremiumFeatureModel.fromMap(item as Map<String, dynamic>),
          )
          .toList();
    } on DioException catch (e) {
      throw Exception(
        'Premium özellikler alınırken bir hata oluştu: ${e.message}',
      );
    } catch (e) {
      throw Exception(
        'Premium özellikler alınırken bir hata oluştu: ${e.toString()}',
      );
    }
  }

  /// Premium abonelik oluşturur (test için)
  Future<Map<String, dynamic>> subscribe(
    String planType, {
    int? durationDays,
  }) async {
    try {
      final headers = await _getAuthHeaders();
      final response = await _dio.post(
        '/api/premium/subscribe',
        data: {
          'planType': planType,
          if (durationDays != null) 'durationDays': durationDays,
        },
        options: Options(headers: headers),
      );

      if (response.statusCode != 200) {
        throw Exception('Sunucu hatası (${response.statusCode})');
      }

      if (response.data == null || response.data['success'] != true) {
        throw Exception('Geçersiz yanıt');
      }

      return response.data['data'];
    } on DioException catch (e) {
      if (e.response?.statusCode == 400) {
        final errorMessage = e.response?.data['error'] as String?;
        throw Exception(errorMessage ?? 'Abonelik oluşturulamadı');
      }
      throw Exception('Abonelik oluşturulurken bir hata oluştu: ${e.message}');
    } catch (e) {
      throw Exception(
        'Abonelik oluşturulurken bir hata oluştu: ${e.toString()}',
      );
    }
  }

  /// Premium aboneliği iptal eder
  Future<void> cancel() async {
    try {
      final headers = await _getAuthHeaders();
      final response = await _dio.post(
        '/api/premium/cancel',
        options: Options(headers: headers),
      );

      if (response.statusCode != 200) {
        throw Exception('Sunucu hatası (${response.statusCode})');
      }

      if (response.data == null || response.data['success'] != true) {
        throw Exception('Geçersiz yanıt');
      }
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) {
        throw Exception('Aktif premium abonelik bulunamadı');
      }
      throw Exception('Abonelik iptal edilirken bir hata oluştu: ${e.message}');
    } catch (e) {
      throw Exception(
        'Abonelik iptal edilirken bir hata oluştu: ${e.toString()}',
      );
    }
  }
}
