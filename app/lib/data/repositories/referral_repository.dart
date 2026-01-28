import '../../core/utils/network_result.dart';
import '../models/referral_stats_model.dart';
import '../datasources/referral_api_datasource.dart';

/// Referans Repository
class ReferralRepository {
  static final ReferralRepository _instance = ReferralRepository._internal();
  factory ReferralRepository() => _instance;
  ReferralRepository._internal();

  final ReferralApiDataSource _apiDataSource = ReferralApiDataSource();

  /// Kullanıcının referans kodunu getirir veya oluşturur
  Future<NetworkResult<String>> getReferralCode() async {
    try {
      final code = await _apiDataSource.getReferralCode();
      return NetworkSuccess(code);
    } catch (e) {
      final errorMessage = e is Exception
          ? e.toString().replaceFirst('Exception: ', '')
          : 'Referans kodu alınırken bir hata oluştu';

      return NetworkError.general(
        errorMessage,
        error: e,
      );
    }
  }

  /// Referans kodunu işler ve ödülleri verir
  Future<NetworkResult<Map<String, dynamic>>> processReferral(String referralCode) async {
    try {
      final result = await _apiDataSource.processReferral(referralCode);
      return NetworkSuccess(result);
    } catch (e) {
      final errorMessage = e is Exception
          ? e.toString().replaceFirst('Exception: ', '')
          : 'Referans işlenirken bir hata oluştu';

      return NetworkError.general(
        errorMessage,
        error: e,
      );
    }
  }

  /// Kullanıcının referans istatistiklerini getirir
  Future<NetworkResult<ReferralStatsModel>> getReferralStats() async {
    try {
      final stats = await _apiDataSource.getReferralStats();
      return NetworkSuccess(stats);
    } catch (e) {
      final errorMessage = e is Exception
          ? e.toString().replaceFirst('Exception: ', '')
          : 'Referans istatistikleri alınırken bir hata oluştu';

      return NetworkError.general(
        errorMessage,
        error: e,
      );
    }
  }

  /// Referans kodunun geçerli olup olmadığını kontrol eder
  Future<NetworkResult<bool>> validateReferralCode(String code) async {
    try {
      final isValid = await _apiDataSource.validateReferralCode(code);
      return NetworkSuccess(isValid);
    } catch (e) {
      return NetworkError.general(
        'Referans kodu doğrulanamadı',
        error: e,
      );
    }
  }
}
