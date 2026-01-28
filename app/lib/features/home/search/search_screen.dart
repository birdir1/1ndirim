import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/empty_state.dart' show AppEmptyState;
import '../../../core/utils/network_result.dart';
import '../../../core/providers/selected_sources_provider.dart';
import '../../../data/models/opportunity_model.dart';
import '../../../data/repositories/opportunity_repository.dart';
import '../widgets/opportunity_card_v2.dart';

/// Arama Sayfası
/// Kampanyaları arama terimine göre arar ve sonuçları gösterir
class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final OpportunityRepository _opportunityRepository = OpportunityRepository.instance;
  final TextEditingController _searchController = TextEditingController();
  final FocusNode _focusNode = FocusNode();
  
  NetworkResult<List<OpportunityModel>> _searchResult = const NetworkSuccess([]);
  List<OpportunityModel> _searchResults = [];
  bool _isSearching = false;
  String _lastSearchTerm = '';
  Timer? _debounceTimer;

  @override
  void initState() {
    super.initState();
    _searchController.addListener(_onSearchChanged);
    // Focus'u otomatik ver
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _focusNode.requestFocus();
    });
  }

  @override
  void dispose() {
    _debounceTimer?.cancel();
    _searchController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  /// Arama terimi değiştiğinde debounce ile arama yap
  void _onSearchChanged() {
    final searchTerm = _searchController.text.trim();
    
    // Debounce: 500ms bekle
    _debounceTimer?.cancel();
    _debounceTimer = Timer(const Duration(milliseconds: 500), () {
      if (searchTerm.isEmpty) {
        setState(() {
          _searchResult = const NetworkSuccess([]);
          _searchResults = [];
          _isSearching = false;
          _lastSearchTerm = '';
        });
      } else if (searchTerm != _lastSearchTerm) {
        _performSearch(searchTerm);
      }
    });
  }

  /// Arama yap
  Future<void> _performSearch(String searchTerm) async {
    if (!mounted || searchTerm.trim().isEmpty) return;

    setState(() {
      _isSearching = true;
      _searchResult = const NetworkLoading();
      _lastSearchTerm = searchTerm;
    });

    try {
      // Seçili kaynakları al
      final sourcesProvider = Provider.of<SelectedSourcesProvider>(context, listen: false);
      final selectedSourceNames = sourcesProvider.getSelectedSourceNames();

      final result = await _opportunityRepository.searchCampaigns(
        searchTerm: searchTerm,
        sourceNames: selectedSourceNames.isNotEmpty ? selectedSourceNames : null,
      );

      if (mounted && _lastSearchTerm == searchTerm) {
        setState(() {
          _searchResult = result;
          _isSearching = false;
          if (result is NetworkSuccess<List<OpportunityModel>>) {
            _searchResults = result.data;
          }
        });
      }
    } catch (e) {
      if (mounted && _lastSearchTerm == searchTerm) {
        setState(() {
          _searchResult = NetworkError.general('Arama yapılırken bir hata oluştu');
          _isSearching = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      appBar: AppBar(
        backgroundColor: AppColors.backgroundLight,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.textPrimaryLight),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: TextField(
          controller: _searchController,
          focusNode: _focusNode,
          autofocus: true,
          style: const TextStyle(
            color: AppColors.textPrimaryLight,
            fontSize: 16,
            fontWeight: FontWeight.w500,
          ),
          decoration: InputDecoration(
            hintText: 'Kampanya ara...',
            hintStyle: TextStyle(
              color: AppColors.textSecondaryLight,
              fontSize: 16,
            ),
            border: InputBorder.none,
            suffixIcon: _searchController.text.isNotEmpty
                ? IconButton(
                    icon: const Icon(Icons.clear, color: AppColors.textSecondaryLight),
                    onPressed: () {
                      _searchController.clear();
                    },
                  )
                : null,
          ),
          onChanged: (_) {
            setState(() {}); // suffixIcon'u güncellemek için
          },
        ),
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    // Arama terimi boşsa
    if (_searchController.text.trim().isEmpty) {
      return AppEmptyState(
        icon: Icons.search,
        title: 'Kampanya ara',
        description: 'Aramak istediğin kampanyanın adını, açıklamasını veya kaynak adını yaz.',
      );
    }

    // Arama yapılıyor
    if (_searchResult is NetworkLoading) {
      return const Center(
        child: CircularProgressIndicator(
          color: AppColors.primaryLight,
        ),
      );
    }

    // Hata durumu
    if (_searchResult is NetworkError) {
      return AppEmptyState(
        icon: Icons.error_outline,
        title: 'Bir hata oluştu',
        description: (_searchResult as NetworkError).message,
        actionText: 'Tekrar Dene',
        onAction: () => _performSearch(_lastSearchTerm),
      );
    }

    // Başarılı sonuç
    if (_searchResult is NetworkSuccess) {
      if (_searchResults.isEmpty) {
        return AppEmptyState(
          icon: Icons.search_off,
          title: 'Sonuç bulunamadı',
          description: '"$_lastSearchTerm" için kampanya bulunamadı. Farklı bir terim deneyebilirsin.',
        );
      }

      return ListView.builder(
        padding: const EdgeInsets.fromLTRB(24, 8, 24, 80),
        itemCount: _searchResults.length + 1, // +1 for header
        itemBuilder: (context, index) {
          if (index == 0) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: Text(
                '${_searchResults.length} sonuç bulundu',
                style: TextStyle(
                  color: AppColors.textSecondaryLight,
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
              ),
            );
          }

          final opportunity = _searchResults[index - 1];
          return RepaintBoundary(
            child: OpportunityCardV2(
              opportunity: opportunity,
            ),
          );
        },
      );
    }

    return const SizedBox.shrink();
  }
}
