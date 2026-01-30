import 'package:flutter/foundation.dart';
import '../../data/models/referral_stats_model.dart';
import '../../data/repositories/referral_repository.dart';

/// Referral Provider
class ReferralProvider extends ChangeNotifier {
  final ReferralRepository _repository;

  ReferralProvider({ReferralRepository? repository})
    : _repository = repository ?? ReferralRepository.instance;

  String? _referralCode;
  ReferralStatsModel? _stats;
  bool _isLoading = false;
  String? _error;

  String? get referralCode => _referralCode;
  ReferralStatsModel? get stats => _stats;
  bool get isLoading => _isLoading;
  String? get error => _error;

  /// Referral kodunu yükler
  Future<void> loadReferralCode() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _referralCode = await _repository.getReferralCode();
      _error = null;
    } catch (e) {
      _error = e.toString();
      debugPrint('❌ Referral code load error: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Referral kodunu uygular
  Future<bool> applyCode(String code) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await _repository.applyReferralCode(code);

      // Stats'ı güncelle
      await loadStats();

      _error = null;
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      debugPrint('❌ Apply referral code error: $e');
      return false;
    }
  }

  /// İstatistikleri yükler
  Future<void> loadStats() async {
    try {
      _stats = await _repository.getStats();
      notifyListeners();
    } catch (e) {
      debugPrint('❌ Stats load error: $e');
    }
  }

  /// Kodu validate eder
  Future<bool> validateCode(String code) async {
    try {
      return await _repository.validateCode(code);
    } catch (e) {
      debugPrint('❌ Validate code error: $e');
      return false;
    }
  }

  /// Error'ı temizler
  void clearError() {
    _error = null;
    notifyListeners();
  }

  /// Provider'ı sıfırlar
  void reset() {
    _referralCode = null;
    _stats = null;
    _isLoading = false;
    _error = null;
    notifyListeners();
  }
}
