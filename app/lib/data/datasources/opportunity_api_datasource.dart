import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import '../../core/config/api_config.dart';
import '../../core/theme/app_colors.dart';
import '../models/discovery_models.dart';
import '../models/opportunity_model.dart';
import '../../core/utils/tag_normalizer.dart';
import '../../core/services/dio_client.dart';

/// API Data Source
/// Backend API'den kampanyaları çeker
class OpportunityApiDataSource {
  final Dio _dio;

  OpportunityApiDataSource({Dio? dio}) : _dio = dio ?? DioClient.instance;

  int _parseInt(dynamic value, {int fallback = 0}) {
    if (value is int) return value;
    if (value is num) return value.toInt();
    if (value is String) {
      final parsed = int.tryParse(value);
      if (parsed != null) return parsed;
    }
    return fallback;
  }

  /// Tüm kampanyaları getirir
  Future<List<OpportunityModel>> getOpportunities({
    List<String>? sourceIds,
  }) async {
    try {
      final queryParams = sourceIds != null && sourceIds.isNotEmpty
          ? {'sourceIds': sourceIds.join(',')}
          : null;

      final response = await _dio.get(
        ApiConfig.campaigns,
        queryParameters: queryParams,
      );

      // Response validation
      if (response.statusCode != 200) {
        throw Exception(
          'Sunucu hatası (${response.statusCode}). Lütfen daha sonra tekrar deneyin.',
        );
      }

      // Response format validation
      if (response.data == null) {
        throw Exception('Sunucudan geçersiz yanıt alındı.');
      }

      // Success flag kontrolü
      if (response.data['success'] != true) {
        final errorMessage =
            response.data['error'] as String? ??
            response.data['message'] as String? ??
            'Kampanyalar yüklenirken bir hata oluştu';
        throw Exception(errorMessage);
      }

      // Data validation
      final campaignsData = response.data['data'];
      if (campaignsData == null) {
        return [];
      }

      if (campaignsData is! List) {
        throw Exception('Sunucudan beklenmeyen veri formatı alındı.');
      }

      // Parse campaigns
      try {
        return campaignsData
            .map((json) => _mapApiResponseToModel(json as Map<String, dynamic>))
            .toList();
      } catch (parseError) {
        throw Exception('Kampanya verileri işlenirken bir hata oluştu.');
      }
    } on DioException catch (e) {
      // Connection timeout
      if (e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.receiveTimeout) {
        throw Exception('Bağlantı zaman aşımı. Lütfen tekrar deneyin.');
      }

      // Connection error (no internet, server down)
      if (e.type == DioExceptionType.connectionError) {
        throw Exception(
          'Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edin.',
        );
      }

      // HTTP error (500, 503, etc.)
      if (e.response != null) {
        final statusCode = e.response!.statusCode;
        if (statusCode == 500) {
          throw Exception('Sunucu hatası. Lütfen daha sonra tekrar deneyin.');
        } else if (statusCode == 503) {
          throw Exception(
            'Servis şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.',
          );
        } else if (statusCode == 404) {
          throw Exception('İstek bulunamadı.');
        } else if (statusCode != null &&
            statusCode >= 400 &&
            statusCode < 500) {
          throw Exception('İstek hatası ($statusCode). Lütfen tekrar deneyin.');
        } else if (statusCode != null && statusCode >= 500) {
          throw Exception(
            'Sunucu hatası ($statusCode). Lütfen daha sonra tekrar deneyin.',
          );
        }
      }

      // Generic DioException
      throw Exception(
        'Kampanyalar yüklenirken bir hata oluştu: ${e.message ?? "Bilinmeyen hata"}',
      );
    } catch (e) {
      // Re-throw if already Exception
      if (e is Exception) {
        rethrow;
      }
      // Wrap other errors
      throw Exception('Beklenmeyen hata: ${e.toString()}');
    }
  }

  /// Keşfet ekranı için kategori + ilk kampanya listelerini getirir.
  Future<DiscoveryCategoriesResult> getDiscoveryCategories({
    int limit = 20,
  }) async {
    try {
      final response = await _dio.get(
        '${ApiConfig.campaigns}/discover',
        queryParameters: {'limit': limit},
      );

      if (response.statusCode != 200 || response.data == null) {
        throw Exception('Keşfet verileri alınamadı.');
      }

      if (response.data['success'] != true) {
        final errorMessage =
            response.data['error'] as String? ??
            response.data['message'] as String? ??
            'Keşfet verileri alınamadı.';
        throw Exception(errorMessage);
      }

      final data = response.data['data'];
      if (data is! List) {
        throw Exception('Keşfet verisi formatı geçersiz.');
      }

      final categories = data.map((item) {
        final json = item as Map<String, dynamic>;
        final campaignsRaw = json['campaigns'];
        final campaigns = campaignsRaw is List
            ? campaignsRaw
                  .map((c) => _mapApiResponseToModel(c as Map<String, dynamic>))
                  .toList()
            : <OpportunityModel>[];

        final sourcesRaw = json['sources'];
        final sources = sourcesRaw is List
            ? sourcesRaw.map((s) => s.toString()).toList()
            : <String>[];

        return DiscoveryCategorySection(
          id: (json['id'] ?? '').toString(),
          name: (json['name'] ?? '').toString(),
          icon: (json['icon'] ?? '🏷️').toString(),
          sources: sources,
          minCampaigns: _parseInt(json['minCampaigns']),
          campaigns: campaigns,
          count: _parseInt(json['count'], fallback: campaigns.length),
          totalCount: _parseInt(
            json['totalCount'],
            fallback: _parseInt(json['count'], fallback: campaigns.length),
          ),
          hasMore: json['hasMore'] == true,
          isEmpty: json['isEmpty'] == true,
          fallbackMessage: json['fallbackMessage'] as String?,
        );
      }).toList();

      final pagination = response.data['pagination'] as Map<String, dynamic>?;

      return DiscoveryCategoriesResult(
        categories: categories,
        totalCategories: _parseInt(
          response.data['totalCategories'],
          fallback: categories.length,
        ),
        perCategoryLimit: _parseInt(
          pagination?['perCategoryLimit'],
          fallback: limit,
        ),
      );
    } on DioException catch (e) {
      throw Exception(
        'Keşfet verileri alınamadı: ${e.message ?? "Bilinmeyen ağ hatası"}',
      );
    } catch (e) {
      if (e is Exception) rethrow;
      throw Exception('Keşfet verileri işlenemedi.');
    }
  }

  /// Tek kategori için keşfet kampanyalarını sayfalı getirir.
  Future<DiscoveryCategoryPageResult> getDiscoveryByCategory({
    required String categoryId,
    int limit = 20,
    int offset = 0,
  }) async {
    try {
      final response = await _dio.get(
        '${ApiConfig.campaigns}/discover/$categoryId',
        queryParameters: {'limit': limit, 'offset': offset},
      );

      if (response.statusCode != 200 || response.data == null) {
        throw Exception('Kategori verisi alınamadı.');
      }

      if (response.data['success'] != true) {
        final errorMessage =
            response.data['error'] as String? ??
            response.data['message'] as String? ??
            'Kategori verisi alınamadı.';
        throw Exception(errorMessage);
      }

      final data = response.data['data'];
      if (data is! Map<String, dynamic>) {
        throw Exception('Kategori verisi formatı geçersiz.');
      }

      final categoryRaw = data['category'] as Map<String, dynamic>?;
      final campaignsRaw = data['campaigns'];
      final campaigns = campaignsRaw is List
          ? campaignsRaw
                .map((c) => _mapApiResponseToModel(c as Map<String, dynamic>))
                .toList()
          : <OpportunityModel>[];
      final pagination = data['pagination'] as Map<String, dynamic>?;

      final section = DiscoveryCategorySection(
        id: (categoryRaw?['id'] ?? categoryId).toString(),
        name: (categoryRaw?['name'] ?? categoryId).toString(),
        icon: (categoryRaw?['icon'] ?? '🏷️').toString(),
        sources: (categoryRaw?['sources'] is List)
            ? (categoryRaw!['sources'] as List)
                  .map((s) => s.toString())
                  .toList()
            : <String>[],
        minCampaigns: _parseInt(categoryRaw?['minCampaigns']),
        campaigns: campaigns,
        count: _parseInt(data['count'], fallback: campaigns.length),
        totalCount: _parseInt(
          data['totalCount'],
          fallback: _parseInt(data['count'], fallback: campaigns.length),
        ),
        hasMore: data['hasMore'] == true,
        isEmpty: data['isEmpty'] == true,
        fallbackMessage: data['fallbackMessage'] as String?,
      );

      return DiscoveryCategoryPageResult(
        category: section,
        campaigns: campaigns,
        count: section.count,
        totalCount: section.totalCount,
        hasMore: section.hasMore,
        isEmpty: section.isEmpty,
        fallbackMessage: section.fallbackMessage,
        limit: _parseInt(pagination?['limit'], fallback: limit),
        offset: _parseInt(pagination?['offset'], fallback: offset),
      );
    } on DioException catch (e) {
      throw Exception(
        'Kategori kampanyaları alınamadı: ${e.message ?? "Bilinmeyen ağ hatası"}',
      );
    } catch (e) {
      if (e is Exception) rethrow;
      throw Exception('Kategori kampanyaları işlenemedi.');
    }
  }

  /// ID'ye göre kampanya getirir
  Future<OpportunityModel> getCampaignById(String id) async {
    try {
      final response = await _dio.get('${ApiConfig.campaigns}/$id');

      // Response validation
      if (response.statusCode != 200) {
        if (response.statusCode == 404) {
          throw Exception('Kampanya bulunamadı');
        }
        throw Exception(
          'Sunucu hatası (${response.statusCode}). Lütfen daha sonra tekrar deneyin.',
        );
      }

      // Response format validation
      if (response.data == null) {
        throw Exception('Sunucudan geçersiz yanıt alındı.');
      }

      // Success flag kontrolü
      if (response.data['success'] != true) {
        final errorMessage =
            response.data['error'] as String? ??
            response.data['message'] as String? ??
            'Kampanya bulunamadı';
        throw Exception(errorMessage);
      }

      // Data validation
      final campaignData = response.data['data'];
      if (campaignData == null) {
        throw Exception('Kampanya bulunamadı');
      }

      if (campaignData is! Map<String, dynamic>) {
        throw Exception('Sunucudan beklenmeyen veri formatı alındı.');
      }

      // Parse campaign
      try {
        return _mapApiResponseToModel(campaignData);
      } catch (parseError) {
        throw Exception('Kampanya verisi işlenirken bir hata oluştu.');
      }
    } on DioException catch (e) {
      // 404 Not Found
      if (e.response?.statusCode == 404) {
        throw Exception('Kampanya bulunamadı');
      }

      // Connection timeout
      if (e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.receiveTimeout) {
        throw Exception('Bağlantı zaman aşımı. Lütfen tekrar deneyin.');
      }

      // Connection error
      if (e.type == DioExceptionType.connectionError) {
        throw Exception(
          'Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edin.',
        );
      }

      // HTTP error
      if (e.response != null) {
        final statusCode = e.response!.statusCode;
        if (statusCode == 500) {
          throw Exception('Sunucu hatası. Lütfen daha sonra tekrar deneyin.');
        } else if (statusCode == 503) {
          throw Exception(
            'Servis şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.',
          );
        }
      }

      // Generic DioException
      throw Exception(
        'Kampanya yüklenirken bir hata oluştu: ${e.message ?? "Bilinmeyen hata"}',
      );
    } catch (e) {
      // Re-throw if already Exception
      if (e is Exception) {
        rethrow;
      }
      // Wrap other errors
      throw Exception('Beklenmeyen hata: ${e.toString()}');
    }
  }

  /// Seçili kaynaklara göre fırsatları filtreler
  /// Backend'de sourceNames parametresi ile filtreleme yapılır
  /// TÜM kampanyaları getirmek için /campaigns/all endpoint'ini kullanır
  Future<List<OpportunityModel>> getOpportunitiesBySources(
    List<String> sourceNames,
  ) async {
    try {
      debugPrint(
        '[CAMPAIGNS_ALL_REQUEST] ${DateTime.now().toIso8601String()} sources=${sourceNames.join(',')}',
      );

      // Backend'de sourceNames parametresi ile filtreleme
      // TÜM kampanyaları getirmek için /all endpoint'ini kullan
      // Defensive: selected sources can be large; do not fetch thousands of items at once.
      // Backend supports `limit/offset` on `/campaigns/all`.
      final queryParams = {
        if (sourceNames.isNotEmpty) 'sourceNames': sourceNames.join(','),
        'limit': 250,
        'offset': 0,
      };

      // Tüm kampanyaları getir (feed type'a bakmaz)
      final response = await _dio.get(
        '${ApiConfig.campaigns}/all',
        queryParameters: queryParams,
      );

      // Response validation
      if (response.statusCode != 200) {
        throw Exception(
          'Sunucu hatası (${response.statusCode}). Lütfen daha sonra tekrar deneyin.',
        );
      }

      // Response format validation
      if (response.data == null) {
        throw Exception('Sunucudan geçersiz yanıt alındı.');
      }

      // Success flag kontrolü
      if (response.data['success'] != true) {
        final errorMessage =
            response.data['error'] as String? ??
            response.data['message'] as String? ??
            'Kampanyalar yüklenirken bir hata oluştu';
        throw Exception(errorMessage);
      }

      // Data validation
      final campaignsData = response.data['data'];
      if (campaignsData == null) {
        // Boş liste döndür (hata değil, sadece kampanya yok)
        return [];
      }

      if (campaignsData is! List) {
        throw Exception('Sunucudan beklenmeyen veri formatı alındı.');
      }

      // Parse campaigns (hata durumunda boş liste döndür, crash etme)
      try {
        return campaignsData
            .map((json) => _mapApiResponseToModel(json as Map<String, dynamic>))
            .toList();
      } catch (parseError) {
        // Parse hatası durumunda boş liste döndür (crash etme)
        throw Exception('Kampanya verileri işlenirken bir hata oluştu.');
      }
    } on DioException catch (e) {
      // Connection timeout
      if (e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.receiveTimeout ||
          e.type == DioExceptionType.sendTimeout) {
        throw Exception('Bağlantı zaman aşımı. Lütfen tekrar deneyin.');
      }

      // Connection error (no internet, server down)
      if (e.type == DioExceptionType.connectionError) {
        throw Exception(
          'Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edin.',
        );
      }

      // HTTP error (500, 503, etc.)
      if (e.response != null) {
        final statusCode = e.response!.statusCode;
        if (statusCode == 429) {
          throw Exception(
            'Çok fazla istek gönderildi. Lütfen biraz sonra tekrar deneyin.',
          );
        }
        if (statusCode == 500) {
          throw Exception('Sunucu hatası. Lütfen daha sonra tekrar deneyin.');
        } else if (statusCode == 503) {
          throw Exception(
            'Servis şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.',
          );
        } else if (statusCode == 404) {
          throw Exception('İstek bulunamadı.');
        } else if (statusCode != null &&
            statusCode >= 400 &&
            statusCode < 500) {
          throw Exception('İstek hatası ($statusCode). Lütfen tekrar deneyin.');
        } else if (statusCode != null && statusCode >= 500) {
          throw Exception(
            'Sunucu hatası ($statusCode). Lütfen daha sonra tekrar deneyin.',
          );
        }
      }

      // Generic DioException
      throw Exception(
        'Kampanyalar yüklenirken bir hata oluştu: ${e.message ?? "Bilinmeyen hata"}',
      );
    } catch (e) {
      // Re-throw if already Exception
      if (e is Exception) {
        rethrow;
      }
      // Wrap other errors
      throw Exception('Beklenmeyen hata: ${e.toString()}');
    }
  }

  /// Kampanyaları arama terimine göre arar
  /// [searchTerm] - Arama terimi (zorunlu)
  /// [sourceNames] - Kaynak isimleri ile filtreleme (opsiyonel)
  /// [category] - Kategori filtresi: 'main', 'light', 'category' (opsiyonel)
  /// [startDate] - Başlangıç tarihi (opsiyonel, format: YYYY-MM-DD)
  /// [endDate] - Bitiş tarihi (opsiyonel, format: YYYY-MM-DD)
  Future<List<OpportunityModel>> searchCampaigns({
    required String searchTerm,
    List<String>? sourceNames,
    String? category,
    String? startDate,
    String? endDate,
  }) async {
    try {
      if (searchTerm.trim().isEmpty) {
        throw Exception('Arama terimi boş olamaz');
      }

      final queryParams = <String, dynamic>{'q': searchTerm.trim()};

      if (sourceNames != null && sourceNames.isNotEmpty) {
        queryParams['sourceNames'] = sourceNames.join(',');
      }

      if (category != null && category.isNotEmpty) {
        queryParams['category'] = category;
      }

      if (startDate != null && startDate.isNotEmpty) {
        queryParams['startDate'] = startDate;
      }

      if (endDate != null && endDate.isNotEmpty) {
        queryParams['endDate'] = endDate;
      }

      final response = await _dio.get(
        '${ApiConfig.campaigns}/search',
        queryParameters: queryParams,
      );

      // Response validation
      if (response.statusCode != 200) {
        throw Exception(
          'Sunucu hatası (${response.statusCode}). Lütfen daha sonra tekrar deneyin.',
        );
      }

      // Response format validation
      if (response.data == null) {
        throw Exception('Sunucudan geçersiz yanıt alındı.');
      }

      // Success flag kontrolü
      if (response.data['success'] != true) {
        final errorMessage =
            response.data['error'] as String? ??
            response.data['message'] as String? ??
            'Arama yapılırken bir hata oluştu';
        throw Exception(errorMessage);
      }

      // Data validation
      final campaignsData = response.data['data'];
      if (campaignsData == null) {
        return [];
      }

      if (campaignsData is! List) {
        throw Exception('Sunucudan beklenmeyen veri formatı alındı.');
      }

      // Parse campaigns
      try {
        return campaignsData
            .map((json) => _mapApiResponseToModel(json as Map<String, dynamic>))
            .toList();
      } catch (parseError) {
        throw Exception('Arama sonuçları işlenirken bir hata oluştu.');
      }
    } on DioException catch (e) {
      // Connection timeout
      if (e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.receiveTimeout) {
        throw Exception('Bağlantı zaman aşımı. Lütfen tekrar deneyin.');
      }

      // Connection error (no internet, server down)
      if (e.type == DioExceptionType.connectionError) {
        throw Exception(
          'Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edin.',
        );
      }

      // HTTP error (400, 500, 503, etc.)
      if (e.response != null) {
        final statusCode = e.response!.statusCode;
        if (statusCode == 400) {
          final errorMessage =
              e.response?.data['message'] as String? ??
              e.response?.data['error'] as String? ??
              'Geçersiz arama terimi';
          throw Exception(errorMessage);
        } else if (statusCode == 500) {
          throw Exception('Sunucu hatası. Lütfen daha sonra tekrar deneyin.');
        } else if (statusCode == 503) {
          throw Exception(
            'Servis şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.',
          );
        }
      }

      // Generic DioException
      throw Exception(
        'Arama yapılırken bir hata oluştu: ${e.message ?? "Bilinmeyen hata"}',
      );
    } catch (e) {
      if (e is Exception) {
        rethrow;
      }
      throw Exception('Beklenmeyen hata: ${e.toString()}');
    }
  }

  /// API response'unu OpportunityModel'e çevirir
  OpportunityModel _mapApiResponseToModel(Map<String, dynamic> json) {
    // Icon name'den IconData'ya mapping
    final iconName = json['icon'] as String? ?? 'local_offer';
    final iconData = _mapIconNameToIconData(iconName);

    // Color string'den Color'a çevir
    final iconColor = _parseColor(json['iconColor'] as String? ?? '#DC2626');
    final iconBgColor = _parseColor(
      json['iconBgColor'] as String? ?? '#FEE2E2',
    );

    final rawTags =
        (json['tags'] as List<dynamic>?)?.map((e) => e.toString()).toList() ??
        <String>[];
    final normalized = TagNormalizer.normalize(rawTags);

    return OpportunityModel(
      id: json['id'] as String,
      title: json['title'] as String,
      subtitle: json['subtitle'] as String? ?? '',
      sourceName: json['sourceName'] as String,
      icon: iconData,
      iconColor: iconColor,
      iconBgColor: iconBgColor,
      tags: [
        if (normalized.primary != null) normalized.primary!,
        ...normalized.secondary,
      ],
      detailText: json['detailText'] as String?,
      description: json['description'] as String?,
      affiliateUrl: json['affiliateUrl'] as String?, // YENİ
      originalUrl: json['originalUrl'] as String?, // YENİ
      expiresAt: json['expiresAt'] as String?,
      sourceLatitude: json['sourceLatitude'] != null
          ? (json['sourceLatitude'] as num).toDouble()
          : null,
      sourceLongitude: json['sourceLongitude'] != null
          ? (json['sourceLongitude'] as num).toDouble()
          : null,
      sourceCity: json['sourceCity'] as String?,
      videoUrl: json['videoUrl'] as String?,
      videoThumbnailUrl: json['videoThumbnailUrl'] as String?,
      videoDuration: json['videoDuration'] != null
          ? json['videoDuration'] as int
          : null,
      currentPrice: json['currentPrice'] != null
          ? (json['currentPrice'] as num).toDouble()
          : null,
      originalPrice: json['originalPrice'] != null
          ? (json['originalPrice'] as num).toDouble()
          : null,
      discountPercentage: json['discountPercentage'] != null
          ? (json['discountPercentage'] as num).toDouble()
          : null,
      priceCurrency: json['priceCurrency'] as String?,
    );
  }

  /// Yakında bitecek kampanyaları getirir
  /// Backend'de özel bir endpoint yok, bu yüzden tüm kampanyaları alıp
  /// expiresAt'e göre filtreleriz
  Future<List<OpportunityModel>> getExpiringSoon({
    int days = 7,
    List<String>? sourceNames,
  }) async {
    try {
      // Tüm kampanyaları al
      final allOpportunities = await getOpportunitiesBySources(
        sourceNames ?? [],
      );

      // Şu anki tarih
      final now = DateTime.now();
      final expiryDate = now.add(Duration(days: days));

      // expiresAt'e göre filtrele
      return allOpportunities.where((opportunity) {
        if (opportunity.expiresAt == null) return false;

        try {
          final expiresAt = DateTime.parse(opportunity.expiresAt!);
          // Şu andan sonra ve belirtilen gün sayısı içinde bitecek kampanyalar
          return expiresAt.isAfter(now) && expiresAt.isBefore(expiryDate);
        } catch (e) {
          return false;
        }
      }).toList();
    } catch (e) {
      // Hata durumunda boş liste döndür
      return [];
    }
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
      // #RRGGBB formatından Color'a
      final hex = hexColor.replaceAll('#', '');
      if (hex.length == 6) {
        return Color(int.parse('FF$hex', radix: 16));
      }
      return AppColors.discountRed; // Fallback
    } catch (e) {
      return AppColors.discountRed; // Fallback
    }
  }
}
