import '../datasources/user_stats_api_datasource.dart';
import '../models/user_stats_model.dart';
import '../../core/utils/network_result.dart';

/// User Stats Repository
/// UI katmanı sadece bu repository üzerinden istatistik verisi alır
class UserStatsRepository {
  final UserStatsApiDataSource _apiDataSource;

  // Singleton instance
  static UserStatsRepository? _instance;
  static UserStatsRepository get instance {
    _instance ??= UserStatsRepository._();
    return _instance!;
  }

  UserStatsRepository._() : _apiDataSource = UserStatsApiDataSource();

  /// Kullanıcı istatistiklerini getirir
  Future<NetworkResult<UserStatsModel>> getUserStats() async {
    try {
      final stats = await _apiDataSource.getUserStats();
      return NetworkSuccess(stats);
    } catch (e) {
      final errorMessage = e is Exception 
          ? e.toString().replaceFirst('Exception: ', '')
          : 'İstatistikler yüklenirken bir hata oluştu';
      
      return NetworkError.general(
        errorMessage,
        error: e,
      );
    }
  }
}
