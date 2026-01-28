import '../../core/utils/network_result.dart';
import '../models/user_points_model.dart';
import '../models/user_badge_model.dart';
import '../datasources/gamification_api_datasource.dart';

/// Gamification Repository
class GamificationRepository {
  static final GamificationRepository _instance = GamificationRepository._internal();
  factory GamificationRepository() => _instance;
  GamificationRepository._internal();

  final GamificationApiDataSource _apiDataSource = GamificationApiDataSource();

  /// Kullanıcının puanlarını getirir
  Future<NetworkResult<UserPointsModel>> getUserPoints() async {
    try {
      final points = await _apiDataSource.getUserPoints();
      return NetworkSuccess(points);
    } catch (e) {
      final errorMessage = e is Exception
          ? e.toString().replaceFirst('Exception: ', '')
          : 'Puanlar yüklenirken bir hata oluştu';

      return NetworkError.general(
        errorMessage,
        error: e,
      );
    }
  }

  /// Kullanıcının rozetlerini getirir
  Future<NetworkResult<List<UserBadgeModel>>> getUserBadges() async {
    try {
      final badges = await _apiDataSource.getUserBadges();
      return NetworkSuccess(badges);
    } catch (e) {
      final errorMessage = e is Exception
          ? e.toString().replaceFirst('Exception: ', '')
          : 'Rozetler yüklenirken bir hata oluştu';

      return NetworkError.general(
        errorMessage,
        error: e,
      );
    }
  }
}
