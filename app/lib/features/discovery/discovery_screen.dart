import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/utils/page_transitions.dart';
import '../../core/utils/network_result.dart';
import '../../data/models/opportunity_model.dart';
import '../../data/repositories/opportunity_repository.dart';
import '../home/campaign_detail_screen.dart';
import 'widgets/category_pill.dart';
import 'widgets/featured_card.dart';
import 'widgets/curated_campaign_card.dart';

/// Discovery Screen - Herkes İçin Fırsatlar
/// Kullanıcının seçtiği kaynaklardan bağımsız, evrensel kampanyalar
class DiscoveryScreen extends StatefulWidget {
  const DiscoveryScreen({super.key});

  @override
  State<DiscoveryScreen> createState() => _DiscoveryScreenState();
}

class _DiscoveryScreenState extends State<DiscoveryScreen> {
  String _selectedCategory = 'Dizi & Film';
  NetworkResult<List<OpportunityModel>> _campaignsResult =
      const NetworkLoading();
  List<OpportunityModel> _allCampaigns = [];
  OpportunityModel? _featuredCampaign;

  final OpportunityRepository _opportunityRepository =
      OpportunityRepository.instance;

  final List<Map<String, dynamic>> _categories = [
    {'name': 'Dizi & Film', 'icon': '🎬'},
    {'name': 'Müzik', 'icon': '🎵'},
    {'name': 'Dijital Servisler', 'icon': '📱'},
    {'name': 'Giyim', 'icon': '🛍️'},
    {'name': 'Cashback', 'icon': '💸'},
    {'name': 'Oyun', 'icon': '🎮'},
  ];

  @override
  void initState() {
    super.initState();
    _loadDiscoveryCampaigns();
  }

  Future<void> _loadDiscoveryCampaigns() async {
    if (!mounted) return;

    setState(() {
      _campaignsResult = const NetworkLoading();
    });

    try {
      // Tüm kampanyaları getir (kaynak filtresi olmadan)
      final result = await _opportunityRepository.getAllOpportunities();

      if (mounted && result is NetworkSuccess<List<OpportunityModel>>) {
        final campaigns = result.data;

        // İlk kampanyayı featured olarak seç
        final featured = campaigns.isNotEmpty ? campaigns.first : null;

        setState(() {
          _campaignsResult = result;
          _allCampaigns = campaigns;
          _featuredCampaign = featured;
        });
      } else if (mounted && result is NetworkError) {
        setState(() {
          _campaignsResult = result;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _campaignsResult = NetworkError.general(
            'Kampanyalar yüklenirken bir hata oluştu',
          );
        });
      }
    }
  }

  List<OpportunityModel> get _filteredCampaigns {
    // Kategori bazlı filtreleme (şimdilik basit tag kontrolü)
    // Gerçek uygulamada backend'den kategori bilgisi gelecek
    return _allCampaigns.where((campaign) {
      final categoryLower = _selectedCategory.toLowerCase();
      final titleLower = campaign.title.toLowerCase();
      final subtitleLower = campaign.subtitle.toLowerCase();
      final tagsLower = campaign.tags.map((t) => t.toLowerCase()).join(' ');

      // Basit keyword matching
      if (categoryLower.contains('dizi') || categoryLower.contains('film')) {
        return titleLower.contains('netflix') ||
            titleLower.contains('disney') ||
            titleLower.contains('prime') ||
            titleLower.contains('blu') ||
            tagsLower.contains('dizi') ||
            tagsLower.contains('film');
      } else if (categoryLower.contains('müzik')) {
        return titleLower.contains('spotify') ||
            titleLower.contains('apple music') ||
            titleLower.contains('youtube music') ||
            tagsLower.contains('müzik');
      } else if (categoryLower.contains('dijital')) {
        return titleLower.contains('dijital') ||
            titleLower.contains('online') ||
            titleLower.contains('uygulama') ||
            tagsLower.contains('dijital');
      } else if (categoryLower.contains('giyim')) {
        return titleLower.contains('giyim') ||
            titleLower.contains('moda') ||
            titleLower.contains('kıyafet') ||
            tagsLower.contains('giyim') ||
            tagsLower.contains('moda');
      } else if (categoryLower.contains('cashback')) {
        return titleLower.contains('cashback') ||
            titleLower.contains('para iadesi') ||
            subtitleLower.contains('cashback') ||
            tagsLower.contains('cashback');
      } else if (categoryLower.contains('oyun')) {
        return titleLower.contains('oyun') ||
            titleLower.contains('game') ||
            titleLower.contains('steam') ||
            tagsLower.contains('oyun');
      }

      return true;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(),
            _buildCategorySelector(),
            Expanded(child: _buildContent()),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.fromLTRB(24, 16, 24, 12),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Herkes İçin Fırsatlar',
                      style: AppTextStyles.headline(
                        isDark: false,
                      ).copyWith(fontSize: 24),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Operatör, banka veya cüzdan fark etmeden',
                      style: AppTextStyles.caption(isDark: false).copyWith(
                        color: AppColors.textSecondaryLight,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ),
              IconButton(
                icon: Icon(
                  Icons.search,
                  color: AppColors.textSecondaryLight,
                  size: 26,
                ),
                onPressed: () {
                  // Future: Search functionality
                },
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildCategorySelector() {
    return Container(
      height: 48,
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 24),
        itemCount: _categories.length,
        itemBuilder: (context, index) {
          final category = _categories[index];
          return CategoryPill(
            name: category['name'] as String,
            emoji: category['icon'] as String,
            isActive: _selectedCategory == category['name'],
            onTap: () {
              setState(() {
                _selectedCategory = category['name'] as String;
              });
            },
          );
        },
      ),
    );
  }

  Widget _buildContent() {
    if (_campaignsResult is NetworkLoading) {
      return const Center(
        child: CircularProgressIndicator(
          valueColor: AlwaysStoppedAnimation<Color>(AppColors.primaryLight),
        ),
      );
    }

    if (_campaignsResult is NetworkError) {
      final error = _campaignsResult as NetworkError<List<OpportunityModel>>;
      return _buildErrorState(error.message);
    }

    if (_campaignsResult is NetworkSuccess<List<OpportunityModel>>) {
      final filtered = _filteredCampaigns;

      return RefreshIndicator(
        onRefresh: _loadDiscoveryCampaigns,
        color: AppColors.primaryLight,
        child: CustomScrollView(
          slivers: [
            // Editör Seçimi
            if (_featuredCampaign != null)
              SliverToBoxAdapter(child: _buildEditorsPick()),

            // Sizin İçin Seçtiklerimiz
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(24, 24, 24, 16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Sizin İçin Seçtiklerimiz',
                      style: AppTextStyles.sectionTitle(isDark: false),
                    ),
                    if (filtered.length > 5)
                      Text(
                        'Tümü',
                        style: AppTextStyles.caption(isDark: false).copyWith(
                          color: AppColors.primaryLight,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                  ],
                ),
              ),
            ),

            // Kampanya Listesi
            if (filtered.isEmpty)
              SliverToBoxAdapter(child: _buildEmptyCategory())
            else
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(24, 0, 24, 100),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate((context, index) {
                    final campaign = filtered[index];
                    return CuratedCampaignCard(
                      campaign: campaign,
                      onTap: () {
                        Navigator.of(context).push(
                          SlidePageRoute(
                            child: CampaignDetailScreen.fromOpportunity(
                              opportunity: campaign,
                            ),
                            direction: SlideDirection.right,
                          ),
                        );
                      },
                    );
                  }, childCount: filtered.length > 10 ? 10 : filtered.length),
                ),
              ),
          ],
        ),
      );
    }

    return const SizedBox.shrink();
  }

  Widget _buildEditorsPick() {
    if (_featuredCampaign == null) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 16, 24, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                'Editör Seçimi',
                style: AppTextStyles.sectionTitle(isDark: false),
              ),
              const SizedBox(width: 6),
              Icon(Icons.verified, color: AppColors.primaryLight, size: 18),
            ],
          ),
          const SizedBox(height: 12),
          FeaturedCard(
            campaign: _featuredCampaign!,
            onTap: () {
              Navigator.of(context).push(
                SlidePageRoute(
                  child: CampaignDetailScreen.fromOpportunity(
                    opportunity: _featuredCampaign!,
                  ),
                  direction: SlideDirection.right,
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyCategory() {
    return Padding(
      padding: const EdgeInsets.all(48),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: AppColors.primaryLight.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.category_outlined,
              size: 40,
              color: AppColors.primaryLight.withValues(alpha: 0.5),
            ),
          ),
          const SizedBox(height: 20),
          Text(
            'Şu an bu kategoride kampanya yok',
            style: AppTextStyles.title(isDark: false).copyWith(fontSize: 18),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            'Diğer kategorilere göz atabilir veya yenilemeyi deneyebilirsin.',
            style: AppTextStyles.body(
              isDark: false,
            ).copyWith(color: AppColors.textSecondaryLight, fontSize: 14),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            onPressed: _loadDiscoveryCampaigns,
            icon: const Icon(Icons.refresh),
            label: const Text('Yenile'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primaryLight,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState(String message) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 64, color: AppColors.error),
            const SizedBox(height: 16),
            Text(
              'Bir Hata Oluştu',
              style: AppTextStyles.title(isDark: false),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              message,
              style: AppTextStyles.body(
                isDark: false,
              ).copyWith(color: AppColors.textSecondaryLight),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _loadDiscoveryCampaigns,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primaryLight,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(
                  horizontal: 32,
                  vertical: 16,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: const Text('Tekrar Dene'),
            ),
          ],
        ),
      ),
    );
  }
}
