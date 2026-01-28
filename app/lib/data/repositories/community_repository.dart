import '../../core/utils/network_result.dart';
import '../models/leaderboard_model.dart';
import '../models/community_stats_model.dart';
import '../datasources/community_api_datasource.dart';

/// Community Repository
class CommunityRepository {
  static final CommunityRepository _instance = CommunityRepository._internal();
  factory CommunityRepository() => _instance;
  CommunityRepository._internal();

  final CommunityApiDataSource _apiDataSource = CommunityApiDataSource();

  /// Leaderboard'u getirir
  Future<NetworkResult<List<LeaderboardModel>>> getLeaderboard({int limit = 10}) async {
    try {
      final leaderboard = await _apiDataSource.getLeaderboard(limit: limit);
      return NetworkSuccess(leaderboard);
    } catch (e) {
      final errorMessage = e is Exception
          ? e.toString().replaceFirst('Exception: ', '')
          : 'Leaderboard yüklenirken bir hata oluştu';

      return NetworkError.general(
        errorMessage,
        error: e,
      );
    }
  }

  /// Topluluk istatistiklerini getirir
  Future<NetworkResult<CommunityStatsModel>> getCommunityStats() async {
    try {
      final stats = await _apiDataSource.getCommunityStats();
      return NetworkSuccess(stats);
    } catch (e) {
      final errorMessage = e is Exception
          ? e.toString().replaceFirst('Exception: ', '')
          : 'Topluluk istatistikleri yüklenirken bir hata oluştu';

      return NetworkError.general(
        errorMessage,
        error: e,
      );
    }
  }
}
