import 'package:dio/dio.dart';
import '../../core/config/api_config.dart';
import '../../core/services/auth_service.dart';
import '../models/price_tracking_model.dart';
import '../models/price_history_model.dart';

/// Price Tracking API Data Source
class PriceTrackingApiDataSource {
  final Dio _dio;
  final AuthService _authService = AuthService();

  PriceTrackingApiDataSource({Dio? dio})
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

  /// Kampanyayı fiyat takibine ekler
  Future<PriceTrackingModel> addPriceTracking({
    required String campaignId,
    double? targetPrice,
    bool notifyOnDrop = true,
    bool notifyOnIncrease = false,
  }) async {
    try {
      final headers = await _getAuthHeaders();
      final response = await _dio.post(
        '/api/price-tracking/$campaignId',
        data: {
          'targetPrice': targetPrice,
          'notifyOnDrop': notifyOnDrop,
          'notifyOnIncrease': notifyOnIncrease,
        },
        options: Options(headers: headers),
      );

      if (response.statusCode != 201) {
        throw Exception('Sunucu hatası (${response.statusCode})');
      }

      if (response.data == null || response.data['success'] != true) {
        throw Exception('Geçersiz yanıt');
      }

      // Response'dan model oluştur
      final data = response.data['data'];
      return PriceTrackingModel.fromMap({
        'id': data['id'],
        'campaignId': data['campaignId'],
        'campaignTitle': '', // API'den gelmiyor, sonra doldurulabilir
        'sourceName': '', // API'den gelmiyor
        'currentPrice': null,
        'originalPrice': null,
        'discountPercentage': null,
        'priceCurrency': 'TRY',
        'targetPrice': data['targetPrice'],
        'notifyOnDrop': data['notifyOnDrop'],
        'notifyOnIncrease': data['notifyOnIncrease'],
        'createdAt': data['createdAt'] ?? DateTime.now().toIso8601String(),
      });
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) {
        throw Exception('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.');
      }
      throw Exception('Fiyat takibi eklenirken bir hata oluştu: ${e.message}');
    } catch (e) {
      throw Exception('Fiyat takibi eklenirken bir hata oluştu: ${e.toString()}');
    }
  }

  /// Kampanyayı fiyat takibinden çıkarır
  Future<void> removePriceTracking(String campaignId) async {
    try {
      final headers = await _getAuthHeaders();
      final response = await _dio.delete(
        '/api/price-tracking/$campaignId',
        options: Options(headers: headers),
      );

      if (response.statusCode != 200) {
        throw Exception('Sunucu hatası (${response.statusCode})');
      }
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) {
        throw Exception('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.');
      }
      throw Exception('Fiyat takibi kaldırılırken bir hata oluştu: ${e.message}');
    } catch (e) {
      throw Exception('Fiyat takibi kaldırılırken bir hata oluştu: ${e.toString()}');
    }
  }

  /// Kullanıcının takip ettiği kampanyaları getirir
  Future<List<PriceTrackingModel>> getPriceTracking() async {
    try {
      final headers = await _getAuthHeaders();
      final response = await _dio.get(
        '/api/price-tracking',
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
          .map((item) => PriceTrackingModel.fromMap(item as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) {
        throw Exception('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.');
      }
      throw Exception('Fiyat takibi getirilirken bir hata oluştu: ${e.message}');
    } catch (e) {
      throw Exception('Fiyat takibi getirilirken bir hata oluştu: ${e.toString()}');
    }
  }

  /// Kampanyanın fiyat geçmişini getirir
  Future<List<PriceHistoryModel>> getPriceHistory(String campaignId, {int limit = 30}) async {
    try {
      final headers = await _getAuthHeaders();
      final response = await _dio.get(
        '/api/price-tracking/$campaignId/history',
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
          .map((item) => PriceHistoryModel.fromMap(item as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) {
        throw Exception('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.');
      }
      throw Exception('Fiyat geçmişi getirilirken bir hata oluştu: ${e.message}');
    } catch (e) {
      throw Exception('Fiyat geçmişi getirilirken bir hata oluştu: ${e.toString()}');
    }
  }
}
