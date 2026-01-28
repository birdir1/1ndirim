import 'package:flutter/foundation.dart';
import '../../data/models/opportunity_model.dart';

/// Karşılaştırma Provider
/// Kullanıcının seçtiği kampanyaları yönetir
class CompareProvider extends ChangeNotifier {
  static const int maxCompareCount = 3;
  final List<OpportunityModel> _campaigns = [];

  List<OpportunityModel> get campaigns => List.unmodifiable(_campaigns);
  int get count => _campaigns.length;
  bool get isFull => _campaigns.length >= maxCompareCount;
  bool get isEmpty => _campaigns.isEmpty;

  /// Kampanya ekle
  bool addCampaign(OpportunityModel campaign) {
    // Zaten ekli mi kontrol et
    if (_campaigns.any((c) => c.id == campaign.id)) {
      return false; // Zaten ekli
    }

    // Maksimum sayı kontrolü
    if (_campaigns.length >= maxCompareCount) {
      return false; // Maksimum sayıya ulaşıldı
    }

    _campaigns.add(campaign);
    notifyListeners();
    return true;
  }

  /// Kampanya kaldır
  void removeCampaign(String campaignId) {
    _campaigns.removeWhere((c) => c.id == campaignId);
    notifyListeners();
  }

  /// Kampanya var mı kontrol et
  bool contains(String campaignId) {
    return _campaigns.any((c) => c.id == campaignId);
  }

  /// Tümünü temizle
  void clear() {
    _campaigns.clear();
    notifyListeners();
  }

  /// Tümünü değiştir (karşılaştırma ekranından geliyorsa)
  void setCampaigns(List<OpportunityModel> campaigns) {
    _campaigns.clear();
    _campaigns.addAll(campaigns.take(maxCompareCount));
    notifyListeners();
  }
}
