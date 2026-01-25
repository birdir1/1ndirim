import 'package:flutter/foundation.dart';
import '../../data/models/source_model.dart';
import '../../data/repositories/source_repository.dart';

/// Selected Sources Provider
/// Global state yönetimi için kullanılır
/// Kullanıcının seçtiği kaynaklar tek gerçek kaynak olarak yönetilir
class SelectedSourcesProvider extends ChangeNotifier {
  List<SourceModel> _selectedSources = [];
  bool _isLoading = true;
  bool _hasError = false;

  List<SourceModel> get selectedSources => _selectedSources;
  bool get isLoading => _isLoading;
  bool get hasError => _hasError;
  bool get hasSelectedSources => _selectedSources.isNotEmpty;

  /// Seçili kaynakları yükler (tek gerçek kaynak)
  /// Uygulama açılışında ve kaynak değiştiğinde çağrılır
  Future<void> loadSelectedSources() async {
    _isLoading = true;
    _hasError = false;
    notifyListeners();

    try {
      // Repository'den seçili kaynakları al (tek gerçek kaynak)
      final sources = await SourceRepository.getSelectedSourcesAsModels();
      
      _selectedSources = sources;
      _isLoading = false;
      _hasError = false;
      notifyListeners();
    } catch (e) {
      _selectedSources = [];
      _isLoading = false;
      _hasError = true;
      notifyListeners();
    }
  }

  /// Seçili kaynakları temizler
  void clearSelectedSources() {
    _selectedSources = [];
    notifyListeners();
  }

  /// Seçili kaynakların isimlerini döndürür
  List<String> getSelectedSourceNames() {
    return _selectedSources.map((s) => s.name).toList();
  }

  /// Seçili kaynakların ID'lerini döndürür
  List<String> getSelectedSourceIds() {
    return _selectedSources.map((s) => s.id).toList();
  }
}
