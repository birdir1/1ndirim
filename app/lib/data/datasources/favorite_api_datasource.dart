import 'package:dio/dio.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/services/dio_client.dart';
import '../models/opportunity_model.dart';

/// Favorite API Data Source
/// Backend API'den favori işlemlerini yönetir
class FavoriteApiDataSource {
  final Dio _dio;
  final FirebaseAuth _firebaseAuth = FirebaseAuth.instance;

  FavoriteApiDataSource({Dio? dio})
      : _dio = dio ?? DioClient.instance;

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

  /// Favori kampanyaları getirir
  Future<List<OpportunityModel>> getFavorites({int? limit, int? offset}) async {
    try {
      final options = await _getAuthOptions();
      final queryParams = <String, dynamic>{};
      if (limit != null) queryParams['limit'] = limit;
      if (offset != null) queryParams['offset'] = offset;

      final response = await _dio.get(
        '/favorites',
        options: options,
        queryParameters: queryParams.isNotEmpty ? queryParams : null,
      );

      if (response.statusCode != 200) {
        throw Exception('Sunucu hatası (${response.statusCode})');
      }

      if (response.data == null || response.data['success'] != true) {
        throw Exception(response.data['error'] ?? 'Favoriler yüklenirken bir hata oluştu');
      }

      final favoritesData = response.data['data'];
      if (favoritesData == null || favoritesData is! List) {
        return [];
      }

      return favoritesData
          .map((json) => _mapApiResponseToModel(json as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      final status = e.response?.statusCode;
      if (status == 401) {
        throw Exception('Oturum süresi dolmuş. Lütfen yeniden giriş yapın.');
      }
      if (status == 429) {
        throw Exception('Çok fazla istek gönderildi. Lütfen biraz sonra tekrar deneyin.');
      }
      if (status != null && status >= 500) {
        throw Exception('Sunucu hatası. Lütfen daha sonra tekrar deneyin.');
      }
      // Prefer our interceptor-mapped exception (AppException) if present.
      if (e.error is Exception) throw e.error as Exception;
      throw Exception('Favoriler yüklenirken bir hata oluştu.');
    } catch (e) {
      if (e is Exception) {
        rethrow;
      }
      throw Exception('Beklenmeyen hata: ${e.toString()}');
    }
  }

  /// Kampanyayı favorilere ekler
  Future<void> addFavorite(String campaignId) async {
    try {
      final options = await _getAuthOptions();
      final response = await _dio.post(
        '/favorites/$campaignId',
        options: options,
      );

      if (response.statusCode != 201) {
        if (response.statusCode == 409) {
          throw Exception('Kampanya zaten favorilerinizde');
        }
        throw Exception('Sunucu hatası (${response.statusCode})');
      }

      if (response.data == null || response.data['success'] != true) {
        throw Exception(response.data['error'] ?? 'Favoriye eklenirken bir hata oluştu');
      }
    } on DioException catch (e) {
      final status = e.response?.statusCode;
      if (status == 401) {
        throw Exception('Oturum süresi dolmuş. Lütfen yeniden giriş yapın.');
      }
      if (status == 409) {
        throw Exception('Kampanya zaten favorilerinizde');
      }
      if (status == 429) {
        throw Exception('Çok fazla istek gönderildi. Lütfen biraz sonra tekrar deneyin.');
      }
      if (status != null && status >= 500) {
        throw Exception('Sunucu hatası. Lütfen daha sonra tekrar deneyin.');
      }
      if (e.error is Exception) throw e.error as Exception;
      throw Exception('Favoriye eklenirken bir hata oluştu.');
    } catch (e) {
      if (e is Exception) {
        rethrow;
      }
      throw Exception('Beklenmeyen hata: ${e.toString()}');
    }
  }

  /// Kampanyayı favorilerden çıkarır
  Future<void> removeFavorite(String campaignId) async {
    try {
      final options = await _getAuthOptions();
      final response = await _dio.delete(
        '/favorites/$campaignId',
        options: options,
      );

      if (response.statusCode != 200) {
        if (response.statusCode == 404) {
          throw Exception('Favori bulunamadı');
        }
        throw Exception('Sunucu hatası (${response.statusCode})');
      }

      if (response.data == null || response.data['success'] != true) {
        throw Exception(response.data['error'] ?? 'Favoriden çıkarılırken bir hata oluştu');
      }
    } on DioException catch (e) {
      final status = e.response?.statusCode;
      if (status == 401) {
        throw Exception('Oturum süresi dolmuş. Lütfen yeniden giriş yapın.');
      }
      if (status == 404) {
        throw Exception('Favori bulunamadı');
      }
      if (status == 429) {
        throw Exception('Çok fazla istek gönderildi. Lütfen biraz sonra tekrar deneyin.');
      }
      if (status != null && status >= 500) {
        throw Exception('Sunucu hatası. Lütfen daha sonra tekrar deneyin.');
      }
      if (e.error is Exception) throw e.error as Exception;
      throw Exception('Favoriden çıkarılırken bir hata oluştu.');
    } catch (e) {
      if (e is Exception) {
        rethrow;
      }
      throw Exception('Beklenmeyen hata: ${e.toString()}');
    }
  }

  /// Kampanyanın favori olup olmadığını kontrol eder
  Future<bool> isFavorite(String campaignId) async {
    try {
      final options = await _getAuthOptions();
      final response = await _dio.get(
        '/favorites/check/$campaignId',
        options: options,
      );

      if (response.statusCode != 200) {
        return false;
      }

      if (response.data == null || response.data['success'] != true) {
        return false;
      }

      return response.data['data']['isFavorite'] == true;
    } catch (e) {
      return false;
    }
  }

  /// Birden fazla kampanyanın favori durumunu kontrol eder
  Future<Map<String, bool>> checkFavorites(List<String> campaignIds) async {
    try {
      final options = await _getAuthOptions();
      final response = await _dio.post(
        '/favorites/batch-check',
        options: options,
        data: {'campaignIds': campaignIds},
      );

      if (response.statusCode != 200) {
        return {};
      }

      if (response.data == null || response.data['success'] != true) {
        return {};
      }

      final Map<String, dynamic> favoriteMap = response.data['data'];
      return favoriteMap.map((key, value) => MapEntry(key, value == true));
    } catch (e) {
      return {};
    }
  }

  /// API response'unu OpportunityModel'e çevirir
  OpportunityModel _mapApiResponseToModel(Map<String, dynamic> json) {
    // Icon name'den IconData'ya mapping
    final iconName = json['icon'] as String? ?? 'local_offer';
    final iconData = _mapIconNameToIconData(iconName);

    // Color string'den Color'a çevir
    final iconColor = _parseColor(json['iconColor'] as String? ?? '#DC2626');
    final iconBgColor = _parseColor(json['iconBgColor'] as String? ?? '#FEE2E2');

    return OpportunityModel(
      id: json['id'] as String,
      title: json['title'] as String,
      subtitle: json['subtitle'] as String? ?? '',
      sourceName: json['sourceName'] as String,
      icon: iconData,
      iconColor: iconColor,
      iconBgColor: iconBgColor,
      tags: (json['tags'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
      affiliateUrl: json['affiliateUrl'] as String?,
      originalUrl: json['originalUrl'] as String?,
    );
  }

  /// Icon name'den IconData'ya mapping
  IconData _mapIconNameToIconData(String iconName) {
    switch (iconName) {
      case 'play_arrow':
        return Icons.play_arrow;
      case 'local_cafe':
        return Icons.local_cafe;
      case 'shopping_bag':
        return Icons.shopping_bag;
      case 'flight':
        return Icons.flight;
      case 'local_offer':
      default:
        return Icons.local_offer;
    }
  }

  /// Hex color string'den Color'a çevir
  Color _parseColor(String hexColor) {
    try {
      final hex = hexColor.replaceAll('#', '');
      if (hex.length == 6) {
        return Color(int.parse('FF$hex', radix: 16));
      }
      return AppColors.discountRed;
    } catch (e) {
      return AppColors.discountRed;
    }
  }

  /// FCM token'ı backend'e gönderir
  Future<void> updateFcmToken(String fcmToken) async {
    try {
      final options = await _getAuthOptions();
      await _dio.post(
        '/users/fcm-token',
        data: {'fcmToken': fcmToken},
        options: options,
      );
    } catch (e) {
      if (e is DioException) {
        if (e.type == DioExceptionType.connectionTimeout ||
            e.type == DioExceptionType.receiveTimeout) {
          throw Exception('Bağlantı zaman aşımı. Lütfen internet bağlantınızı kontrol edin.');
        } else if (e.response?.statusCode == 401) {
          throw Exception('Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.');
        } else if (e.response?.statusCode == 500) {
          throw Exception('Sunucu hatası. Lütfen daha sonra tekrar deneyin.');
        }
      }
      throw Exception('FCM token güncelleme hatası: ${e.toString()}');
    }
  }
}
