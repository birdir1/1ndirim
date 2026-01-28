import '../../core/utils/network_result.dart';
import '../models/premium_subscription_model.dart';
import '../models/premium_plan_model.dart';
import '../models/premium_feature_model.dart';
import '../datasources/premium_api_datasource.dart';

/// Premium Repository
class PremiumRepository {
  static final PremiumRepository _instance = PremiumRepository._internal();
  factory PremiumRepository() => _instance;
  PremiumRepository._internal();

  final PremiumApiDataSource _apiDataSource = PremiumApiDataSource();

  /// Kullanıcının premium durumunu kontrol eder
  Future<NetworkResult<Map<String, dynamic>>> getPremiumStatus() async {
    try {
      final data = await _apiDataSource.getPremiumStatus();
      return NetworkSuccess(data);
    } catch (e) {
      final errorMessage = e is Exception
          ? e.toString().replaceFirst('Exception: ', '')
          : 'Premium durum kontrol edilirken bir hata oluştu';

      return NetworkError.general(
        errorMessage,
        error: e,
      );
    }
  }

  /// Tüm premium planları getirir
  Future<NetworkResult<List<PremiumPlanModel>>> getPlans() async {
    try {
      final plans = await _apiDataSource.getPlans();
      return NetworkSuccess(plans);
    } catch (e) {
      final errorMessage = e is Exception
          ? e.toString().replaceFirst('Exception: ', '')
          : 'Premium planlar alınırken bir hata oluştu';

      return NetworkError.general(
        errorMessage,
        error: e,
      );
    }
  }

  /// Premium özelliklerini getirir
  Future<NetworkResult<List<PremiumFeatureModel>>> getFeatures() async {
    try {
      final features = await _apiDataSource.getFeatures();
      return NetworkSuccess(features);
    } catch (e) {
      final errorMessage = e is Exception
          ? e.toString().replaceFirst('Exception: ', '')
          : 'Premium özellikler alınırken bir hata oluştu';

      return NetworkError.general(
        errorMessage,
        error: e,
      );
    }
  }

  /// Premium abonelik oluşturur
  Future<NetworkResult<Map<String, dynamic>>> subscribe(String planType, {int? durationDays}) async {
    try {
      final result = await _apiDataSource.subscribe(planType, durationDays: durationDays);
      return NetworkSuccess(result);
    } catch (e) {
      final errorMessage = e is Exception
          ? e.toString().replaceFirst('Exception: ', '')
          : 'Abonelik oluşturulurken bir hata oluştu';

      return NetworkError.general(
        errorMessage,
        error: e,
      );
    }
  }

  /// Premium aboneliği iptal eder
  Future<NetworkResult<void>> cancel() async {
    try {
      await _apiDataSource.cancel();
      return const NetworkSuccess(null);
    } catch (e) {
      final errorMessage = e is Exception
          ? e.toString().replaceFirst('Exception: ', '')
          : 'Abonelik iptal edilirken bir hata oluştu';

      return NetworkError.general(
        errorMessage,
        error: e,
      );
    }
  }
}
