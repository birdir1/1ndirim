import '../../core/utils/network_result.dart';
import '../models/price_tracking_model.dart';
import '../models/price_history_model.dart';
import '../datasources/price_tracking_api_datasource.dart';

/// Price Tracking Repository
class PriceTrackingRepository {
  static final PriceTrackingRepository _instance = PriceTrackingRepository._internal();
  factory PriceTrackingRepository() => _instance;
  PriceTrackingRepository._internal();

  final PriceTrackingApiDataSource _apiDataSource = PriceTrackingApiDataSource();

  /// Kampanyayı fiyat takibine ekler
  Future<NetworkResult<PriceTrackingModel>> addPriceTracking({
    required String campaignId,
    double? targetPrice,
    bool notifyOnDrop = true,
    bool notifyOnIncrease = false,
  }) async {
    try {
      final tracking = await _apiDataSource.addPriceTracking(
        campaignId: campaignId,
        targetPrice: targetPrice,
        notifyOnDrop: notifyOnDrop,
        notifyOnIncrease: notifyOnIncrease,
      );
      return NetworkSuccess(tracking);
    } catch (e) {
      final errorMessage = e is Exception
          ? e.toString().replaceFirst('Exception: ', '')
          : 'Fiyat takibi eklenirken bir hata oluştu';

      return NetworkError.general(
        errorMessage,
        error: e,
      );
    }
  }

  /// Kampanyayı fiyat takibinden çıkarır
  Future<NetworkResult<void>> removePriceTracking(String campaignId) async {
    try {
      await _apiDataSource.removePriceTracking(campaignId);
      return const NetworkSuccess(null);
    } catch (e) {
      final errorMessage = e is Exception
          ? e.toString().replaceFirst('Exception: ', '')
          : 'Fiyat takibi kaldırılırken bir hata oluştu';

      return NetworkError.general(
        errorMessage,
        error: e,
      );
    }
  }

  /// Kullanıcının takip ettiği kampanyaları getirir
  Future<NetworkResult<List<PriceTrackingModel>>> getPriceTracking() async {
    try {
      final tracking = await _apiDataSource.getPriceTracking();
      return NetworkSuccess(tracking);
    } catch (e) {
      final errorMessage = e is Exception
          ? e.toString().replaceFirst('Exception: ', '')
          : 'Fiyat takibi getirilirken bir hata oluştu';

      return NetworkError.general(
        errorMessage,
        error: e,
      );
    }
  }

  /// Kampanyanın fiyat geçmişini getirir
  Future<NetworkResult<List<PriceHistoryModel>>> getPriceHistory(
    String campaignId, {
    int limit = 30,
  }) async {
    try {
      final history = await _apiDataSource.getPriceHistory(campaignId, limit: limit);
      return NetworkSuccess(history);
    } catch (e) {
      final errorMessage = e is Exception
          ? e.toString().replaceFirst('Exception: ', '')
          : 'Fiyat geçmişi getirilirken bir hata oluştu';

      return NetworkError.general(
        errorMessage,
        error: e,
      );
    }
  }
}
