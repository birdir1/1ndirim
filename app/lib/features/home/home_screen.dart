import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/widgets/empty_state.dart';
import '../../core/utils/page_transitions.dart';
import '../../core/utils/network_result.dart';
import '../../core/providers/selected_sources_provider.dart';
import '../../data/models/opportunity_model.dart';
import '../../data/repositories/opportunity_repository.dart';
import '../sources/edit_sources_screen.dart';
import 'widgets/opportunity_card.dart';
import 'widgets/opportunity_card_v2.dart';
import 'widgets/filter_chip_item.dart';
import 'widgets/home_header.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  String _selectedFilter = 'Tümü';
  NetworkResult<List<OpportunityModel>> _opportunitiesResult =
      const NetworkLoading();
  NetworkResult<List<OpportunityModel>> _expiringSoonResult =
      const NetworkLoading();
  List<OpportunityModel> _allOpportunities = [];
  List<OpportunityModel> _expiringSoonOpportunities = [];
  List<Map<String, dynamic>> _filters = [];
  List<OpportunityModel>? _cachedFilteredOpportunities;
  String? _cachedFilterKey;
  bool _isLoading = false; // Sürekli yenilemeyi önlemek için flag
  String? _lastSourceNamesKey; // Son yüklenen kaynakları takip et

  final OpportunityRepository _opportunityRepository =
      OpportunityRepository.instance;

  @override
  void initState() {
    super.initState();
    // Provider'dan kaynakları dinle ve kampanyaları yükle
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final sourcesProvider = Provider.of<SelectedSourcesProvider>(
        context,
        listen: false,
      );
      if (!sourcesProvider.isLoading) {
        _updateFilters();
        _loadOpportunities();
        _loadExpiringSoon();
      }
    });
  }

  /// Yakında bitecek kampanyaları yükler
  Future<void> _loadExpiringSoon() async {
    if (!mounted) return;

    final sourcesProvider = Provider.of<SelectedSourcesProvider>(
      context,
      listen: false,
    );
    final selectedSourceNames = sourcesProvider.getSelectedSourceNames();

    setState(() {
      _expiringSoonResult = const NetworkLoading();
    });

    try {
      final result = await _opportunityRepository.getExpiringSoon(
        days: 7,
        sourceNames: selectedSourceNames.isNotEmpty
            ? selectedSourceNames
            : null,
      );

      if (mounted) {
        setState(() {
          _expiringSoonResult = result;
          if (result is NetworkSuccess<List<OpportunityModel>>) {
            _expiringSoonOpportunities = result.data;
          }
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _expiringSoonResult = NetworkError.general(
            'Yakında bitecek kampanyalar yüklenirken bir hata oluştu',
          );
        });
      }
    }
  }

  /// Repository'den fırsatları yükler
  /// SADECE kullanıcının seçtiği kaynaklardan kampanyaları getirir
  Future<void> _loadOpportunities({bool force = false}) async {
    if (!mounted || (_isLoading && !force)) return;

    final sourcesProvider = Provider.of<SelectedSourcesProvider>(
      context,
      listen: false,
    );

    // Provider'dan seçili kaynakların isimlerini al (tek gerçek kaynak)
    final selectedSourceNames = sourcesProvider.getSelectedSourceNames();
    final sourceNamesKey = selectedSourceNames.join(',');

    // Eğer kaynaklar değişmediyse ve zaten yükleniyorsa, tekrar yükleme
    if (!force && sourceNamesKey == _lastSourceNamesKey && _isLoading) {
      return;
    }

    setState(() {
      _isLoading = true;
      _opportunitiesResult = const NetworkLoading();
    });

    // Eğer hiç kaynak seçilmemişse boş liste döndür
    if (selectedSourceNames.isEmpty) {
      if (mounted) {
        setState(() {
          _opportunitiesResult = const NetworkSuccess([]);
          _allOpportunities = [];
          _cachedFilteredOpportunities = null;
          _cachedFilterKey = null;
          _isLoading = false;
          _lastSourceNamesKey = sourceNamesKey;
        });
      }
      return;
    }

    try {
      // Sadece seçili kaynaklardan kampanyaları getir
      final result = await _opportunityRepository.getOpportunitiesBySources(
        selectedSourceNames,
      );

      if (mounted) {
        setState(() {
          _opportunitiesResult = result;
          _isLoading = false;
          _lastSourceNamesKey = sourceNamesKey;
          if (result is NetworkSuccess<List<OpportunityModel>>) {
            _allOpportunities = (result).data;
            _cachedFilteredOpportunities = null; // Cache'i temizle
            _cachedFilterKey = null;
          }
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _opportunitiesResult = NetworkError.general(
            'Fırsatlar yüklenirken bir hata oluştu: ${e.toString()}',
          );
          _isLoading = false;
        });
      }
    }
  }

  /// Filtreleri günceller (Provider'dan kaynakları alır)
  void _updateFilters() {
    final sourcesProvider = Provider.of<SelectedSourcesProvider>(
      context,
      listen: false,
    );
    final selectedSources = sourcesProvider.selectedSources;

    _filters = [
      {'name': 'Tümü', 'color': null, 'sourceId': null},
    ];

    for (var source in selectedSources) {
      _filters.add({
        'name': source.name,
        'color': _getFilterColorForSource(source.name),
        'sourceId': source.id,
      });
    }

    // Eğer seçili filtre artık listede yoksa, 'Tümü'ne geç
    if (_selectedFilter != 'Tümü' &&
        !_filters.any((f) => f['name'] == _selectedFilter)) {
      _selectedFilter = 'Tümü';
    }
  }

  /// Kaynak için filtre rengini döndürür
  Color? _getFilterColorForSource(String sourceName) {
    final sourcesProvider = Provider.of<SelectedSourcesProvider>(
      context,
      listen: false,
    );
    final selectedSources = sourcesProvider.selectedSources;

    // Kaynağı bul
    final source = selectedSources.firstWhere(
      (s) => s.name == sourceName,
      orElse: () => selectedSources.first,
    );

    // İlk birkaç kaynak için özel renkler (Mavi Tonları Paleti)
    final colors = [
      AppColors.filterBlue,
      AppColors.filterBlueLight,
      AppColors.filterGreen,
      AppColors.filterTeal,
    ];

    final index = selectedSources.indexOf(source);
    if (index < colors.length) {
      return colors[index];
    }

    // Diğer kaynaklar için kaynağın kendi rengini kullan
    return source.color;
  }

  @override
  Widget build(BuildContext context) {
    // Provider değişikliklerini dinle (kaynak seçimi değiştiğinde otomatik refresh)
    return Consumer<SelectedSourcesProvider>(
      builder: (context, sourcesProvider, child) {
        // Provider yüklendiğinde veya kaynaklar değiştiğinde güncelle
        if (!sourcesProvider.isLoading) {
          final currentSourceNames = sourcesProvider.getSelectedSourceNames();
          final currentSourceNamesKey = currentSourceNames.join(',');

          // Kaynaklar değiştiyse güncelle (sadece bir kez)
          if (currentSourceNamesKey != _lastSourceNamesKey) {
            WidgetsBinding.instance.addPostFrameCallback((_) {
              if (mounted) {
                _updateFilters();
                _loadOpportunities(force: true);
              }
            });
          }
        }

        return SafeArea(
          child: Column(
            children: [
              const HomeHeader(),
              _buildFilterBar(),
              Expanded(child: _buildContent()),
            ],
          ),
        );
      },
    );
  }

  Widget _buildFilterBar() {
    return Container(
      height: 48, // Daha kompakt
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 24),
        itemCount: _filters.length,
        itemBuilder: (context, index) {
          final filter = _filters[index];
          return RepaintBoundary(
            child: FilterChipItem(
              name: filter['name'] as String,
              color: filter['color'] as Color?,
              isActive: _selectedFilter == filter['name'],
              onTap: () {
                setState(() {
                  _selectedFilter = filter['name'] as String;
                  _cachedFilteredOpportunities = null; // Cache'i temizle
                  _cachedFilterKey = null;
                });
              },
            ),
          );
        },
      ),
    );
  }

  /// Seçili kaynaklara göre fırsatları filtreler (memoized)
  /// Not: _allOpportunities zaten sadece seçili kaynaklardan geliyor
  List<OpportunityModel> get _filteredOpportunities {
    final sourcesProvider = Provider.of<SelectedSourcesProvider>(
      context,
      listen: false,
    );
    final selectedSources = sourcesProvider.selectedSources;
    final cacheKey =
        '${selectedSources.map((s) => s.id).join(',')}_$_selectedFilter';

    if (_cachedFilteredOpportunities != null && _cachedFilterKey == cacheKey) {
      return _cachedFilteredOpportunities!;
    }

    // _allOpportunities zaten sadece seçili kaynaklardan geldiği için
    // Sadece seçili filtreye göre filtrele
    final result = _selectedFilter == 'Tümü'
        ? _allOpportunities
        : _allOpportunities
              .where((opp) => opp.sourceName == _selectedFilter)
              .toList();

    _cachedFilteredOpportunities = result;
    _cachedFilterKey = cacheKey;
    return result;
  }

  Widget _buildContent() {
    final sourcesProvider = Provider.of<SelectedSourcesProvider>(context);

    // Kaynaklar yükleniyor
    if (sourcesProvider.isLoading) {
      return const Center(
        child: CircularProgressIndicator(color: AppColors.primaryLight),
      );
    }

    // Hiç kaynak seçilmemişse
    if (!sourcesProvider.hasSelectedSources) {
      return _buildNoSourcesEmptyState();
    }

    // Fırsatlar yükleniyor
    if (_opportunitiesResult is NetworkLoading) {
      return _buildLoadingSkeleton();
    }

    // Fırsatlar yüklenirken hata oluştu
    if (_opportunitiesResult is NetworkError) {
      return _buildErrorState(_opportunitiesResult as NetworkError);
    }

    // Başarılı sonuç
    if (_opportunitiesResult is NetworkSuccess) {
      final filtered = _filteredOpportunities;

      // Filtre sonucu boşsa
      if (filtered.isEmpty) {
        return AppEmptyState(
          icon: Icons.search_off,
          title: 'Fırsat bulunamadı',
          description: _selectedFilter == 'Tümü'
              ? 'Seçtiğin kaynaklar için henüz aktif fırsat yok. Yakında burada görünecek.'
              : '$_selectedFilter için şu anda aktif fırsat bulunmuyor. Farklı bir filtre seçmeyi dene.',
          actionText: _selectedFilter != 'Tümü' ? 'Tümünü Göster' : null,
          onAction: _selectedFilter != 'Tümü'
              ? () {
                  setState(() {
                    _selectedFilter = 'Tümü';
                    _cachedFilteredOpportunities = null;
                    _cachedFilterKey = null;
                  });
                }
              : null,
        );
      }

      return CustomScrollView(
        slivers: [
          // Yakında Bitecek Bölümü
          if (_expiringSoonOpportunities.isNotEmpty)
            SliverToBoxAdapter(child: _buildExpiringSoonSection()),

          // Ana Kampanyalar Listesi
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(24, 4, 24, 80),
            sliver: SliverList(
              delegate: SliverChildBuilderDelegate((context, index) {
                final opportunity = filtered[index];
                return RepaintBoundary(
                  child: OpportunityCardV2(opportunity: opportunity),
                );
              }, childCount: filtered.length),
            ),
          ),
        ],
      );
    }

    // Fallback (olmayacak ama güvenlik için)
    return const SizedBox.shrink();
  }

  /// Yakında Bitecek kampanyalar bölümü
  Widget _buildExpiringSoonSection() {
    if (_expiringSoonOpportunities.isEmpty) {
      return const SizedBox.shrink();
    }

    return Container(
      margin: const EdgeInsets.fromLTRB(24, 0, 24, 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.warning.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: AppColors.warning.withValues(alpha: 0.3),
          width: 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.access_time, color: AppColors.warning, size: 20),
              const SizedBox(width: 8),
              Text(
                'Yakında Bitecek',
                style: AppTextStyles.body(isDark: false).copyWith(
                  fontWeight: FontWeight.bold,
                  color: AppColors.warning,
                ),
              ),
              const Spacer(),
              Text(
                '${_expiringSoonOpportunities.length} kampanya',
                style: AppTextStyles.caption(
                  isDark: false,
                ).copyWith(color: AppColors.textSecondaryLight),
              ),
            ],
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 120,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: _expiringSoonOpportunities.length,
              itemBuilder: (context, index) {
                final opportunity = _expiringSoonOpportunities[index];
                return Container(
                  width: 280,
                  margin: const EdgeInsets.only(right: 12),
                  child: OpportunityCardV2(opportunity: opportunity),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  /// Loading skeleton gösterir
  Widget _buildLoadingSkeleton() {
    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(24, 4, 24, 80),
      itemCount: 3,
      itemBuilder: (context, index) {
        return RepaintBoundary(
          child: Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.cardBackground,
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: AppColors.shadowDark,
                  blurRadius: 12,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Skeleton icon
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: AppColors.surfaceLight,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 12),
                // Skeleton content
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: double.infinity,
                        height: 16,
                        decoration: BoxDecoration(
                          color: AppColors.surfaceLight,
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Container(
                        width: 150,
                        height: 14,
                        decoration: BoxDecoration(
                          color: AppColors.surfaceLight,
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Container(
                            width: 60,
                            height: 20,
                            decoration: BoxDecoration(
                              color: AppColors.surfaceLight,
                              borderRadius: BorderRadius.circular(16),
                            ),
                          ),
                          const SizedBox(width: 6),
                          Container(
                            width: 80,
                            height: 20,
                            decoration: BoxDecoration(
                              color: AppColors.surfaceLight,
                              borderRadius: BorderRadius.circular(16),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  /// Error state gösterir
  Widget _buildErrorState(NetworkError error) {
    return AppEmptyState(
      icon: Icons.error_outline,
      title: 'Bir hata oluştu',
      description: error.message,
      actionText: 'Tekrar Dene',
      onAction: () => _loadOpportunities(force: true),
    );
  }

  /// Kaynak seçilmemiş durumunda gösterilecek empty state
  Widget _buildNoSourcesEmptyState() {
    return AppEmptyState(
      icon: Icons.account_balance_outlined,
      title: 'Kaynaklarını seç',
      description:
          'Fırsatları görmek için önce hangi banka ve operatörlere sahip olduğunu seçmelisin.',
      actionText: 'Kaynaklarını Seç',
      onAction: () {
        Navigator.of(context)
            .push(
              SlidePageRoute(
                child: const EditSourcesScreen(),
                direction: SlideDirection.right,
              ),
            )
            .then((_) {
              // Ekrandan dönünce Provider'ı refresh et (tek gerçek kaynak)
              final sourcesProvider = Provider.of<SelectedSourcesProvider>(
                context,
                listen: false,
              );
              sourcesProvider.loadSelectedSources().then((_) {
                // Provider güncellendi, kampanyaları yeniden yükle
                _loadOpportunities();
              });
            });
      },
    );
  }
}
