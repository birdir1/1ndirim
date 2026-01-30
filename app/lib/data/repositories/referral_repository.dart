import '../datasources/referral_api_datasource.dart';
import '../models/referral_code_model.dart';
import '../models/referral_stats_model.dart';

/// Referral Repository
class ReferralRepository {
  final ReferralApiDataSource _datasource;

  ReferralRepository({ReferralApiDataSource? datasource})
    : _datasource = datasource ?? ReferralApiDataSource();

  /// Singleton instance
  static final ReferralRepository _instance = ReferralRepository();
  static ReferralRepository get instance => _instance;

  /// Kullanıcının referral kodunu getirir
  Future<String> getReferralCode() async {
    try {
      final result = await _datasource.getReferralCode();
      return result.code;
    } catch (e) {
      rethrow;
    }
  }

  /// Referral kodunu uygular
  Future<void> applyReferralCode(String code) async {
    try {
      await _datasource.applyReferralCode(code);
    } catch (e) {
      rethrow;
    }
  }

  /// Kullanıcının referral istatistiklerini getirir
  Future<ReferralStatsModel> getStats() async {
    try {
      return await _datasource.getStats();
    } catch (e) {
      rethrow;
    }
  }

  /// Referral kodunu validate eder
  Future<bool> validateCode(String code) async {
    try {
      return await _datasource.validateCode(code);
    } catch (e) {
      return false;
    }
  }
}
