import 'package:flutter/material.dart';
import '../data/repositories/premium_repository.dart';
import '../data/models/premium_subscription_model.dart';
import '../utils/network_result.dart';

/// Premium Durum Provider'ı
class PremiumProvider extends ChangeNotifier {
  static final PremiumProvider _instance = PremiumProvider._internal();
  factory PremiumProvider() => _instance;
  PremiumProvider._internal();

  final PremiumRepository _repository = PremiumRepository();
  
  bool? _isPremium;
  PremiumSubscriptionModel? _subscription;
  bool _isLoading = false;

  bool? get isPremium => _isPremium;
  PremiumSubscriptionModel? get subscription => _subscription;
  bool get isLoading => _isLoading;

  /// Premium durumunu yükler
  Future<void> loadPremiumStatus() async {
    if (_isLoading) return;

    setState(() {
      _isLoading = true;
    });

    final result = await _repository.getPremiumStatus();

    if (result is NetworkSuccess) {
      _isPremium = result.data['isPremium'] as bool? ?? false;
      if (result.data['subscription'] != null) {
        _subscription = PremiumSubscriptionModel.fromMap(
          result.data['subscription'] as Map<String, dynamic>,
        );
      } else {
        _subscription = null;
      }
    } else {
      _isPremium = false;
      _subscription = null;
    }

    setState(() {
      _isLoading = false;
    });
  }

  /// Premium durumunu yeniler
  Future<void> refresh() async {
    await loadPremiumStatus();
  }

  void setState(VoidCallback fn) {
    fn();
    notifyListeners();
  }
}
