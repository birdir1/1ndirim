import '../datasources/favorite_api_datasource.dart';
import '../models/opportunity_model.dart';
import '../../core/utils/network_result.dart';

/// Favorite Repository
/// UI katmanı sadece bu repository üzerinden favori işlemleri yapar
class FavoriteRepository {
  final FavoriteApiDataSource _dataSource;

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
  }) async {
    try {
      final favorites = await _dataSource.getFavorites(
        limit: limit,
        offset: offset,
      );
      return NetworkSuccess(favorites);
    } catch (e) {
      final errorMessage = e is Exception
          ? e.toString().replaceFirst('Exception: ', '')
          : 'Favoriler yüklenirken bir hata oluştu';
      return NetworkError.general(errorMessage, error: e);
    }
  }

  /// Kampanyayı favorilere ekler
  Future<NetworkResult<void>> addFavorite(String campaignId) async {
    try {
      await _dataSource.addFavorite(campaignId);
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
    try {
      return await _dataSource.checkFavorites(campaignIds);
    } catch (e) {
      return {};
    }
  }
}
