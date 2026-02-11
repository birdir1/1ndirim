import '../datasources/favorite_api_datasource.dart';
import '../models/opportunity_model.dart';
import '../../core/utils/network_result.dart';

/// Favorite Repository
/// UI katmanı sadece bu repository üzerinden favori işlemleri yapar
class FavoriteRepository {
  final FavoriteApiDataSource _dataSource;
  static const Duration _favoritesCacheTtl = Duration(seconds: 10);
  static const Duration _batchCheckCacheTtl = Duration(seconds: 8);

  Future<NetworkResult<List<OpportunityModel>>>? _inFlightFavoritesRequest;
  List<OpportunityModel>? _cachedFavorites;
  DateTime? _cachedFavoritesAt;
  final Map<String, Future<Map<String, bool>>> _inFlightBatchChecks = {};
  final Map<String, _BatchCheckCacheEntry> _batchCheckCache = {};

  // Singleton instance
  static FavoriteRepository? _instance;
  static FavoriteRepository get instance {
    _instance ??= FavoriteRepository._();
    return _instance!;
  }

  FavoriteRepository._() : _dataSource = FavoriteApiDataSource();

  /// Favori kampanyaları getirir
  Future<NetworkResult<List<OpportunityModel>>> getFavorites({
    int? limit,
    int? offset,
    bool force = false,
  }) async {
    // Yalnızca varsayılan liste çağrılarında kısa süreli cache kullan.
    final canUseCache = limit == null && offset == null;
    if (!force && canUseCache && _cachedFavorites != null && _cachedFavoritesAt != null) {
      final age = DateTime.now().difference(_cachedFavoritesAt!);
      if (age <= _favoritesCacheTtl) {
        return NetworkSuccess(List<OpportunityModel>.from(_cachedFavorites!));
      }
    }

    if (!force && _inFlightFavoritesRequest != null) {
      return await _inFlightFavoritesRequest!;
    }

    final request = _fetchFavorites(limit: limit, offset: offset, canUseCache: canUseCache);
    _inFlightFavoritesRequest = request;
    try {
      return await request;
    } catch (e) {
      final errorMessage = e is Exception
          ? e.toString().replaceFirst('Exception: ', '')
          : 'Favoriler yüklenirken bir hata oluştu';
      return NetworkError.general(errorMessage, error: e);
    } finally {
      if (identical(_inFlightFavoritesRequest, request)) {
        _inFlightFavoritesRequest = null;
      }
    }
  }

  /// Kampanyayı favorilere ekler
  Future<NetworkResult<void>> addFavorite(String campaignId) async {
    try {
      await _dataSource.addFavorite(campaignId);
      _invalidateFavoritesState();
      return const NetworkSuccess(null);
    } catch (e) {
      final errorMessage = e is Exception
          ? e.toString().replaceFirst('Exception: ', '')
          : 'Favoriye eklenirken bir hata oluştu';
      return NetworkError.general(errorMessage, error: e);
    }
  }

  /// Kampanyayı favorilerden çıkarır
  Future<NetworkResult<void>> removeFavorite(String campaignId) async {
    try {
      await _dataSource.removeFavorite(campaignId);
      _invalidateFavoritesState();
      return const NetworkSuccess(null);
    } catch (e) {
      final errorMessage = e is Exception
          ? e.toString().replaceFirst('Exception: ', '')
          : 'Favoriden çıkarılırken bir hata oluştu';
      return NetworkError.general(errorMessage, error: e);
    }
  }

  /// Kampanyanın favori olup olmadığını kontrol eder
  Future<bool> isFavorite(String campaignId) async {
    try {
      return await _dataSource.isFavorite(campaignId);
    } catch (e) {
      return false;
    }
  }

  /// Birden fazla kampanyanın favori durumunu kontrol eder
  Future<Map<String, bool>> checkFavorites(List<String> campaignIds) async {
    final normalizedIds = campaignIds
        .map((id) => id.trim())
        .where((id) => id.isNotEmpty)
        .toList();
    if (normalizedIds.isEmpty) return {};

    final dedupedSortedIds = normalizedIds.toSet().toList()..sort();
    final requestKey = dedupedSortedIds.join('|');
    final now = DateTime.now();

    final cached = _batchCheckCache[requestKey];
    if (cached != null && now.difference(cached.createdAt) <= _batchCheckCacheTtl) {
      return {
        for (final id in normalizedIds) id: cached.value[id] ?? false,
      };
    }

    final inFlight = _inFlightBatchChecks[requestKey];
    if (inFlight != null) {
      final map = await inFlight;
      return {
        for (final id in normalizedIds) id: map[id] ?? false,
      };
    }

    final request = _dataSource.checkFavorites(dedupedSortedIds);
    _inFlightBatchChecks[requestKey] = request;
    try {
      final map = await request;
      _batchCheckCache[requestKey] = _BatchCheckCacheEntry(
        value: Map<String, bool>.from(map),
        createdAt: now,
      );
      return {
        for (final id in normalizedIds) id: map[id] ?? false,
      };
    } catch (e) {
      return {};
    } finally {
      _inFlightBatchChecks.remove(requestKey);
    }
  }

  Future<NetworkResult<List<OpportunityModel>>> _fetchFavorites({
    int? limit,
    int? offset,
    required bool canUseCache,
  }) async {
    final favorites = await _dataSource.getFavorites(
      limit: limit,
      offset: offset,
    );
    if (canUseCache) {
      _cachedFavorites = List<OpportunityModel>.from(favorites);
      _cachedFavoritesAt = DateTime.now();
    }
    return NetworkSuccess(favorites);
  }

  void _invalidateFavoritesState() {
    _cachedFavorites = null;
    _cachedFavoritesAt = null;
    _batchCheckCache.clear();
  }
}

class _BatchCheckCacheEntry {
  final Map<String, bool> value;
  final DateTime createdAt;

  const _BatchCheckCacheEntry({
    required this.value,
    required this.createdAt,
  });
}
