import '../datasources/rating_api_datasource.dart';
import '../models/rating_model.dart';
import '../../core/utils/network_result.dart';

/// Rating Repository
/// UI katmanı sadece bu repository üzerinden puanlama verisi alır
class RatingRepository {
  final RatingApiDataSource _apiDataSource;

  // Singleton instance
  static RatingRepository? _instance;
  static RatingRepository get instance {
    _instance ??= RatingRepository._();
    return _instance!;
  }

  RatingRepository._() : _apiDataSource = RatingApiDataSource();

  /// Bir kampanyanın puanlama istatistiklerini getirir
  Future<NetworkResult<RatingModel>> getRatingStats(String campaignId) async {
    try {
      final rating = await _apiDataSource.getRatingStats(campaignId);
      return NetworkSuccess(rating);
    } catch (e) {
      final errorMessage = e is Exception 
          ? e.toString().replaceFirst('Exception: ', '')
          : 'Puanlama istatistikleri yüklenirken bir hata oluştu';
      
      return NetworkError.general(
        errorMessage,
        error: e,
      );
    }
  }

  /// Bir kampanyaya puan verir veya günceller
  Future<NetworkResult<void>> submitRating({
    required String campaignId,
    required int rating, // 1-5 arası
  }) async {
    try {
      await _apiDataSource.submitRating(
        campaignId: campaignId,
        rating: rating,
      );
      return const NetworkSuccess(null);
    } catch (e) {
      final errorMessage = e is Exception 
          ? e.toString().replaceFirst('Exception: ', '')
          : 'Puan verilirken bir hata oluştu';
      
      return NetworkError.general(
        errorMessage,
        error: e,
      );
    }
  }

  /// Bir kampanyaya verilen puanı siler
  Future<NetworkResult<void>> deleteRating(String campaignId) async {
    try {
      await _apiDataSource.deleteRating(campaignId);
      return const NetworkSuccess(null);
    } catch (e) {
      final errorMessage = e is Exception 
          ? e.toString().replaceFirst('Exception: ', '')
          : 'Puan silinirken bir hata oluştu';
      
      return NetworkError.general(
        errorMessage,
        error: e,
      );
    }
  }
}
