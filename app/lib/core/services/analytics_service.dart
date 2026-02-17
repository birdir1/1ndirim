import 'package:firebase_analytics/firebase_analytics.dart';
import 'package:flutter/foundation.dart';
import '../utils/app_logger.dart';

/// Firebase Analytics Service
/// Kullanıcı davranışlarını ve event'leri takip eder
class AnalyticsService {
  static final AnalyticsService _instance = AnalyticsService._internal();
  factory AnalyticsService() => _instance;
  AnalyticsService._internal();

  FirebaseAnalytics? _analytics;
  FirebaseAnalyticsObserver? _observer;
  bool _isInitialized = false;

  /// Analytics'i başlat
  Future<void> initialize() async {
    try {
      _analytics = FirebaseAnalytics.instance;
      _observer = FirebaseAnalyticsObserver(analytics: _analytics!);

      // Debug mode'da analytics'i devre dışı bırak
      if (kDebugMode) {
        await _analytics!.setAnalyticsCollectionEnabled(false);
        AppLogger.info('🔧 Analytics devre dışı (Debug mode)');
        return;
      }

      // Production'da aktif et
      await _analytics!.setAnalyticsCollectionEnabled(true);

      _isInitialized = true;
      AppLogger.info('✅ Analytics başlatıldı');
    } catch (e) {
      AppLogger.error('❌ Analytics başlatılamadı: $e');
    }
  }

  /// Analytics observer'ı döndür (Navigator için)
  FirebaseAnalyticsObserver? get observer => _observer;

  /// Screen view logla
  Future<void> logScreenView(String screenName) async {
    if (!_isInitialized || _analytics == null) return;

    try {
      await _analytics!.logScreenView(screenName: screenName);
      AppLogger.info('📊 Screen: $screenName');
    } catch (e) {
      AppLogger.error('❌ Analytics logScreenView hatası: $e');
    }
  }

  /// Custom event logla
  Future<void> logEvent({
    required String name,
    Map<String, Object>? parameters,
  }) async {
    if (!_isInitialized || _analytics == null) return;

    try {
      await _analytics!.logEvent(name: name, parameters: parameters);
      AppLogger.info('📊 Event: $name ${parameters ?? ""}');
    } catch (e) {
      AppLogger.error('❌ Analytics logEvent hatası: $e');
    }
  }

  /// Kullanıcı ID'si set et
  Future<void> setUserId(String userId) async {
    if (!_isInitialized || _analytics == null) return;

    try {
      await _analytics!.setUserId(id: userId);
      AppLogger.info('👤 Analytics User ID: $userId');
    } catch (e) {
      AppLogger.error('❌ Analytics setUserId hatası: $e');
    }
  }

  /// User property set et
  Future<void> setUserProperty({
    required String name,
    required String value,
  }) async {
    if (!_isInitialized || _analytics == null) return;

    try {
      await _analytics!.setUserProperty(name: name, value: value);
    } catch (e) {
      AppLogger.error('❌ Analytics setUserProperty hatası: $e');
    }
  }

  // Önceden tanımlı event'ler

  /// Login event
  Future<void> logLogin(String method) async {
    await logEvent(name: 'login', parameters: {'method': method});
  }

  /// Sign up event
  Future<void> logSignUp(String method) async {
    await logEvent(name: 'sign_up', parameters: {'method': method});
  }

  /// Campaign view event
  Future<void> logCampaignView(String campaignId, String campaignName) async {
    await logEvent(
      name: 'campaign_view',
      parameters: {'campaign_id': campaignId, 'campaign_name': campaignName},
    );
  }

  /// Campaign click event
  Future<void> logCampaignClick(String campaignId, String campaignName) async {
    await logEvent(
      name: 'campaign_click',
      parameters: {'campaign_id': campaignId, 'campaign_name': campaignName},
    );
  }

  /// Favorite add event
  Future<void> logFavoriteAdd(String campaignId) async {
    await logEvent(
      name: 'favorite_add',
      parameters: {'campaign_id': campaignId},
    );
  }

  /// Favorite remove event
  Future<void> logFavoriteRemove(String campaignId) async {
    await logEvent(
      name: 'favorite_remove',
      parameters: {'campaign_id': campaignId},
    );
  }

  /// Search event
  Future<void> logSearch(String searchTerm) async {
    await logEvent(name: 'search', parameters: {'search_term': searchTerm});
  }

  /// Share event
  Future<void> logShare(String contentType, String itemId) async {
    await logEvent(
      name: 'share',
      parameters: {'content_type': contentType, 'item_id': itemId},
    );
  }

  /// Compare event
  Future<void> logCompare(List<String> campaignIds) async {
    await logEvent(
      name: 'compare_campaigns',
      parameters: {
        'campaign_count': campaignIds.length,
        'campaign_ids': campaignIds.join(','),
      },
    );
  }

  /// === Discovery / Explore specific events ===
  Future<void> logExploreScreenView({
    required String sort,
    String? categoryId,
  }) async {
    await logEvent(
      name: 'explore_screen_view',
      parameters: _compact({
        'sort': sort,
        'category_id': categoryId,
      }),
    );
  }

  Future<void> logExploreModeSwitch({
    required String from,
    required String to,
    String? categoryId,
  }) async {
    await logEvent(
      name: 'explore_mod_switch',
      parameters: _compact({
        'from': from,
        'to': to,
        'category_id': categoryId,
      }),
    );
  }

  Future<void> logExploreCategoryClick({
    required String categoryId,
    required String categoryName,
    required String sort,
  }) async {
    await logEvent(
      name: 'explore_category_click',
      parameters: _compact({
        'category_id': categoryId,
        'category_name': categoryName,
        'sort': sort,
      }),
    );
  }

  Future<void> logExploreCardOpen({
    required String campaignId,
    required String campaignTitle,
    String? categoryId,
    required String sort,
    bool sponsored = false,
    String? platform,
    bool isFree = false,
    double? discountPercent,
  }) async {
    await logEvent(
      name: 'explore_card_open',
      parameters: _compact({
        'campaign_id': campaignId,
        'campaign_title': campaignTitle,
        'category_id': categoryId,
        'sort': sort,
        'sponsored': sponsored,
        'platform': platform,
        'is_free': isFree,
        'discount_percent': discountPercent,
      }),
    );
  }

  Future<void> logExploreSponsoredClick({
    required String campaignId,
    String? categoryId,
    required String sort,
  }) async {
    await logEvent(
      name: 'explore_sponsored_click',
      parameters: _compact({
        'campaign_id': campaignId,
        'category_id': categoryId,
        'sort': sort,
      }),
    );
  }

  Future<void> logExploreSaveFavorite({
    required String campaignId,
    String? categoryId,
    required String sort,
  }) async {
    await logEvent(
      name: 'explore_save_favorite',
      parameters: _compact({
        'campaign_id': campaignId,
        'category_id': categoryId,
        'sort': sort,
      }),
    );
  }

  Map<String, Object> _compact(Map<String, Object?> raw) {
    final filtered = <String, Object>{};
    raw.forEach((key, value) {
      if (value == null) return;
      if (value is bool || value is num || value is String) {
        filtered[key] = value;
      }
    });
    return filtered;
  }
}
