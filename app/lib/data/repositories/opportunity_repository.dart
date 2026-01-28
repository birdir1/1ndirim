import '../datasources/opportunity_api_datasource.dart';
import '../datasources/opportunity_mock_datasource.dart';
import '../models/opportunity_model.dart';
import '../../core/utils/network_result.dart';

/// Opportunity Repository
/// UI katmanı sadece bu repository üzerinden veri alır
class OpportunityRepository {
  // API datasource (ana kaynak)
  final OpportunityApiDataSource _apiDataSource;
  
  // Mock datasource (fallback veya test için)
  final OpportunityMockDataSource _mockDataSource;
  
  // API kullanımını kontrol eder (şimdilik true, backend hazır olduğunda)
  static const bool _useApi = true;

  // Singleton instance
  static OpportunityRepository? _instance;
  static OpportunityRepository get instance {
    _instance ??= OpportunityRepository._();
    return _instance!;
  }

  OpportunityRepository._()
      : _apiDataSource = OpportunityApiDataSource(),
        _mockDataSource = OpportunityMockDataSource();
  
  // Aktif datasource'u döndürür
  dynamic get _dataSource => _useApi ? _apiDataSource : _mockDataSource;

  /// Tüm fırsatları getirir
  Future<NetworkResult<List<OpportunityModel>>> getOpportunities() async {
    try {
      final opportunities = await _dataSource.getOpportunities();
      return NetworkSuccess(opportunities);
    } catch (e) {
      // Exception mesajını extract et
      final errorMessage = e is Exception 
          ? e.toString().replaceFirst('Exception: ', '')
          : 'Fırsatlar yüklenirken bir hata oluştu';
      
      // Hata durumunda NetworkError döndür (app crash etmeyecek)
      return NetworkError.general(
        errorMessage,
        error: e,
      );
    }
  }

  /// Seçili kaynaklara göre fırsatları getirir
  Future<NetworkResult<List<OpportunityModel>>> getOpportunitiesBySources(
    List<String> sourceNames,
  ) async {
    try {
      if (sourceNames.isEmpty) {
        return const NetworkSuccess([]);
      }
      final opportunities = await _dataSource.getOpportunitiesBySources(sourceNames);
      return NetworkSuccess(opportunities);
    } catch (e) {
      // Exception mesajını extract et
      final errorMessage = e is Exception 
          ? e.toString().replaceFirst('Exception: ', '')
          : 'Fırsatlar yüklenirken bir hata oluştu';
      
      // Hata durumunda NetworkError döndür (app crash etmeyecek)
      return NetworkError.general(
        errorMessage,
        error: e,
      );
    }
  }

  /// Kampanyaları arama terimine göre arar
  Future<NetworkResult<List<OpportunityModel>>> searchCampaigns({
    required String searchTerm,
    List<String>? sourceNames,
    String? category,
    String? startDate,
    String? endDate,
  }) async {
    try {
      if (searchTerm.trim().isEmpty) {
        return NetworkError.general('Arama terimi boş olamaz');
      }

      final opportunities = await _apiDataSource.searchCampaigns(
        searchTerm: searchTerm,
        sourceNames: sourceNames,
        category: category,
        startDate: startDate,
        endDate: endDate,
      );
      return NetworkSuccess(opportunities);
    } catch (e) {
      // Exception mesajını extract et
      final errorMessage = e is Exception 
          ? e.toString().replaceFirst('Exception: ', '')
          : 'Arama yapılırken bir hata oluştu';
      
      // Hata durumunda NetworkError döndür (app crash etmeyecek)
      return NetworkError.general(
        errorMessage,
        error: e,
      );
    }
  }

  /// Yakında bitecek kampanyaları getirir
  Future<NetworkResult<List<OpportunityModel>>> getExpiringSoon({
    int days = 7,
    List<String>? sourceNames,
  }) async {
    try {
      final opportunities = await _apiDataSource.getExpiringSoon(
        days: days,
        sourceNames: sourceNames,
      );
      return NetworkSuccess(opportunities);
    } catch (e) {
      final errorMessage = e is Exception 
          ? e.toString().replaceFirst('Exception: ', '')
          : 'Yakında bitecek kampanyalar yüklenirken bir hata oluştu';
      
      return NetworkError.general(
        errorMessage,
        error: e,
      );
    }
  }
}
