import 'dart:math' as math;

import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/theme/app_ui_tokens.dart';
import '../../core/utils/page_transitions.dart';
import '../../core/utils/network_result.dart';
import '../../core/l10n/app_localizations.dart';
import '../../core/services/analytics_service.dart';
import '../../data/models/discovery_models.dart';
import '../../data/models/opportunity_model.dart';
import '../../data/repositories/opportunity_repository.dart';
import '../home/campaign_detail_screen.dart';
import '../home/search/search_screen.dart';
import 'widgets/category_pill.dart';
import 'widgets/featured_card.dart';
import 'widgets/curated_campaign_card.dart';

typedef DiscoveryCategoriesLoader =
    Future<NetworkResult<DiscoveryCategoriesResult>> Function(int limit, String sort);
typedef DiscoveryCategoryPageLoader =
    Future<NetworkResult<DiscoveryCategoryPageResult>> Function({
      required String categoryId,
      required int limit,
      required int offset,
      required String sort,
    });

/// Discovery Screen - Herkes İçin Fırsatlar
/// Backend'den kategori bazlı kampanyaları alır.
class DiscoveryScreen extends StatefulWidget {
  final DiscoveryCategoriesLoader? loadDiscoveryCategories;
  final DiscoveryCategoryPageLoader? loadDiscoveryCategoryPage;

  const DiscoveryScreen({
    super.key,
    this.loadDiscoveryCategories,
    this.loadDiscoveryCategoryPage,
  });

  @override
  State<DiscoveryScreen> createState() => _DiscoveryScreenState();
}

class _DiscoveryScreenState extends State<DiscoveryScreen> {
  static const int _initialPerCategoryLimit = 12;
  static const int _pageSize = 20;
  static const List<Map<String, String>> _sortModes = [
    {'id': 'popular', 'label': 'Popüler'},
    {'id': 'latest', 'label': 'Son'},
    {'id': 'free_week', 'label': 'Ücretsiz'},
    {'id': 'expiring', 'label': 'Bitiyor'},
  ];

  String? _selectedCategoryId;
  String _selectedSort = 'latest';
  NetworkResult<DiscoveryCategoriesResult> _discoveryResult =
      const NetworkLoading();
  List<DiscoveryCategorySection> _categories = [];
  final Map<String, DiscoveryCategorySection> _categoryById = {};
  final Set<String> _expandedCategoryIds = {};

  OpportunityModel? _featuredCampaign;
  bool _isLoadingMore = false;
  String? _loadMoreError;

  Future<NetworkResult<DiscoveryCategoriesResult>> _fetchDiscoveryCategories(
    int limit,
  ) {
    final loader = widget.loadDiscoveryCategories;
    if (loader != null) {
      return loader(limit, _selectedSort);
    }
    return OpportunityRepository.instance.getDiscoveryCategories(
      limit: limit,
      sort: _selectedSort,
    );
  }

  Future<NetworkResult<DiscoveryCategoryPageResult>>
  _fetchDiscoveryCategoryPage({
    required String categoryId,
    required int limit,
    required int offset,
  }) {
    final loader = widget.loadDiscoveryCategoryPage;
    if (loader != null) {
      return loader(
        categoryId: categoryId,
        limit: limit,
        offset: offset,
        sort: _selectedSort,
      );
    }
    return OpportunityRepository.instance.getDiscoveryByCategory(
      categoryId: categoryId,
      limit: limit,
      offset: offset,
      sort: _selectedSort,
    );
  }

  @override
  void initState() {
    super.initState();
    _loadDiscoveryCampaigns();
  }

  Future<void> _loadDiscoveryCampaigns() async {
    if (!mounted) return;

    setState(() {
      _discoveryResult = const NetworkLoading();
      _loadMoreError = null;
      _isLoadingMore = false;
    });

    final result = await _fetchDiscoveryCategories(_initialPerCategoryLimit);

    if (!mounted) return;

    if (result is NetworkSuccess<DiscoveryCategoriesResult>) {
      final incomingCategories = result.data.categories;
      final incomingMap = {for (final c in incomingCategories) c.id: c};

      final preservedSelection = _selectedCategoryId;
      final nextSelected =
          preservedSelection != null &&
              incomingMap.containsKey(preservedSelection)
          ? preservedSelection
          : (incomingCategories.isNotEmpty
                ? incomingCategories.first.id
                : null);

      setState(() {
        _discoveryResult = result;
        _categories = incomingCategories;
        _categoryById
          ..clear()
          ..addAll(incomingMap);
        _selectedCategoryId = nextSelected;
        _featuredCampaign = _pickFeaturedCampaign(incomingCategories);
      });
      _logScreenView(nextSelected);
      return;
    }

    setState(() {
      _discoveryResult = result;
      _categories = [];
      _categoryById.clear();
      _selectedCategoryId = null;
      _featuredCampaign = null;
    });
  }

  OpportunityModel? _pickFeaturedCampaign(
    List<DiscoveryCategorySection> categories,
  ) {
    final all = <OpportunityModel>[];
    final seen = <String>{};

    for (final category in categories) {
      for (final campaign in category.campaigns) {
        if (seen.add(campaign.id)) {
          all.add(campaign);
        }
      }
    }

    if (all.isEmpty) return null;

    all.sort((a, b) => _campaignScore(b).compareTo(_campaignScore(a)));
    return all.first;
  }

  void _logScreenView(String? categoryId) {
    AnalyticsService().logExploreScreenView(
      sort: _selectedSort,
      categoryId: categoryId,
    );
  }

  void _logCardOpen(OpportunityModel campaign) {
    AnalyticsService().logExploreCardOpen(
      campaignId: campaign.id,
      campaignTitle: campaign.title,
      categoryId: _selectedCategoryId,
      sort: _selectedSort,
      sponsored: campaign.sponsored ?? false,
      platform: campaign.platform,
      isFree: campaign.isFree ?? false,
      discountPercent: campaign.discountPercentage,
    );
    if (campaign.sponsored == true) {
      AnalyticsService().logExploreSponsoredClick(
        campaignId: campaign.id,
        categoryId: _selectedCategoryId,
        sort: _selectedSort,
      );
    }
  }

  int _campaignScore(OpportunityModel c) {
    int score = 0;

    if (c.discountPercentage != null) {
      score += c.discountPercentage!.round();
    }

    final titleLower = c.title.toLowerCase();
    final descLower = (c.description ?? '').toLowerCase();
    final tagsLower = c.tags.join(' ').toLowerCase();

    if (titleLower.contains('cashback') ||
        descLower.contains('cashback') ||
        tagsLower.contains('cashback')) {
      score += 12;
    }

    if (titleLower.contains('indirim') || tagsLower.contains('indirim')) {
      score += 6;
    }

    if ((c.description ?? '').trim().length > 24) {
      score += 4;
    }

    if (c.tags.isNotEmpty) {
      score += math.min(4, c.tags.length);
    }

    return score;
  }

  DiscoveryCategorySection? get _selectedCategory {
    if (_selectedCategoryId == null) return null;
    return _categoryById[_selectedCategoryId!];
  }

  bool get _isSelectedExpanded {
    final id = _selectedCategoryId;
    if (id == null) return false;
    return _expandedCategoryIds.contains(id);
  }

  List<OpportunityModel> get _visibleCampaigns {
    final selected = _selectedCategory;
    if (selected == null) return const [];

    final filtered = selected.campaigns.where((c) {
      if (selected.sources.isEmpty) return true;
      return selected.sources.contains(c.sourceName);
    }).toList();

    if (_isSelectedExpanded) return filtered;
    return filtered.take(10).toList();
  }

  void _onCategoryTap(String categoryId) {
    if (categoryId == _selectedCategoryId) return;

    final category = _categoryById[categoryId];
    AnalyticsService().logExploreCategoryClick(
      categoryId: categoryId,
      categoryName: category?.name ?? 'unknown',
      sort: _selectedSort,
    );

    setState(() {
      _selectedCategoryId = categoryId;
      _loadMoreError = null;
    });
  }

  void _expandSelectedCategory() {
    final selected = _selectedCategory;
    if (selected == null) return;

    if (!_isSelectedExpanded) {
      setState(() {
        _expandedCategoryIds.add(selected.id);
      });
    }
  }

  Future<void> _loadMoreForSelectedCategory() async {
    final selected = _selectedCategory;
    if (selected == null || _isLoadingMore || !selected.hasMore) return;

    setState(() {
      _isLoadingMore = true;
      _loadMoreError = null;
    });

    final result = await _fetchDiscoveryCategoryPage(
      categoryId: selected.id,
      limit: _pageSize,
      offset: selected.campaigns.length,
    );

    if (!mounted) return;

    if (result is NetworkSuccess<DiscoveryCategoryPageResult>) {
      final page = result.data;
      final byId = {for (final c in selected.campaigns) c.id: c};
      for (final campaign in page.campaigns) {
        byId[campaign.id] = campaign;
      }
      final mergedCampaigns = byId.values.toList();

      final updated = selected.copyWith(
        campaigns: mergedCampaigns,
        count: mergedCampaigns.length,
        totalCount: page.totalCount,
        hasMore: page.hasMore,
        isEmpty: page.isEmpty,
        fallbackMessage: page.fallbackMessage,
      );

      setState(() {
        _applyCategoryUpdate(updated);
        _isLoadingMore = false;
      });
      return;
    }

    setState(() {
      _isLoadingMore = false;
      _loadMoreError =
          (result as NetworkError<DiscoveryCategoryPageResult>).message;
    });
  }

  void _applyCategoryUpdate(DiscoveryCategorySection updated) {
    _categoryById[updated.id] = updated;

    final next = <DiscoveryCategorySection>[];
    for (final category in _categories) {
      if (category.id == updated.id) {
        next.add(updated);
      } else {
        next.add(category);
      }
    }
    _categories = next;
  }

  Future<void> _openDiscoverySearch() async {
    if (!mounted) return;
    await Navigator.of(context).push(
      SlidePageRoute(
        child: const SearchScreen(restrictToSelectedSources: false),
        direction: SlideDirection.right,
      ),
    );
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

  IconData _sortIcon(String id) {
    switch (id) {
      case 'popular':
        return Icons.trending_up;
      case 'latest':
        return Icons.fiber_new;
      case 'free_week':
        return Icons.card_giftcard;
      case 'expiring':
        return Icons.timer;
      default:
        return Icons.sort;
    }
  }

  Widget _buildHeader() {
    final l10n = AppLocalizations.of(context)!;
    return Padding(
      padding: const EdgeInsets.fromLTRB(
        AppUiTokens.screenPadding,
        AppUiTokens.sectionGap,
        AppUiTokens.screenPadding,
        8,
      ),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: AppUiTokens.elevatedSurface().copyWith(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              AppColors.primaryLight.withValues(alpha: 0.08),
              Colors.white,
            ],
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    l10n.discoveryTitle,
                    style: AppTextStyles.headline(
                      isDark: false,
                    ).copyWith(fontSize: 24),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    l10n.discoverySubtitle,
                    style: AppTextStyles.caption(isDark: false).copyWith(
                      color: AppColors.textSecondaryLight,
                      fontSize: 13,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      Icon(Icons.local_fire_department,
                          size: 16, color: AppColors.primaryLight),
                      const SizedBox(width: 4),
                      Flexible(
                        child: Text(
                          _categories.isNotEmpty
                              ? '${_categories.length} kategori • ${_categories.fold<int>(0, (p, c) => p + c.count)} fırsat'
                              : 'Keşfet güncelleniyor',
                          style: AppTextStyles.caption(isDark: false).copyWith(
                            color: AppColors.textSecondaryLight,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
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
              tooltip: l10n.search,
              onPressed: _openDiscoverySearch,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSortTabs() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(
        AppUiTokens.screenPadding,
        8,
        AppUiTokens.screenPadding,
        4,
      ),
      child: Container(
        height: 44,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          boxShadow: [
            BoxShadow(
              color: AppColors.shadowDark.withValues(alpha: 0.06),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
          border: Border.all(color: AppColors.divider),
        ),
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          itemBuilder: (context, index) {
            final mode = _sortModes[index];
            final isActive = mode['id'] == _selectedSort;
            return GestureDetector(
              onTap: () {
                if (isActive) return;
                final prev = _selectedSort;
                final next = mode['id']!;
                setState(() => _selectedSort = next);
                AnalyticsService().logExploreModeSwitch(
                  from: prev,
                  to: next,
                  categoryId: _selectedCategoryId,
                );
                _loadDiscoveryCampaigns();
              },
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 150),
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  color: isActive ? AppColors.primaryLight.withValues(alpha: 0.12) : Colors.white,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: isActive
                        ? AppColors.primaryLight.withValues(alpha: 0.5)
                        : AppColors.divider,
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      _sortIcon(mode['id']!),
                      size: 16,
                      color: isActive ? AppColors.primaryLight : AppColors.textSecondaryLight,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      mode['label'] ?? '',
                      style: AppTextStyles.caption(isDark: false).copyWith(
                        color: isActive ? AppColors.primaryLight : AppColors.textPrimaryLight,
                        fontWeight: isActive ? FontWeight.w700 : FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
          separatorBuilder: (_, __) => const SizedBox(width: 8),
          itemCount: _sortModes.length,
        ),
      ),
    );
  }

  Widget _buildCategorySelector() {
    if (_categories.isEmpty) {
      return const SizedBox(height: 48);
    }

    return Container(
      height: 54,
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(
          horizontal: AppUiTokens.screenPadding,
        ),
        itemCount: _categories.length,
        itemBuilder: (context, index) {
          final category = _categories[index];
          final isActive = _selectedCategoryId == category.id;
          return Padding(
            padding: const EdgeInsets.only(right: 10),
            child: GestureDetector(
              onTap: () => _onCategoryTap(category.id),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 150),
                padding:
                    const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  color: isActive
                      ? AppColors.primaryLight.withValues(alpha: 0.12)
                      : Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: isActive
                        ? AppColors.primaryLight.withValues(alpha: 0.5)
                        : AppColors.divider,
                  ),
                  boxShadow: [
                    if (isActive)
                      BoxShadow(
                        color: AppColors.primaryLight.withValues(alpha: 0.16),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                  ],
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(category.icon, style: const TextStyle(fontSize: 16)),
                    const SizedBox(width: 6),
                    Text(
                      category.name,
                      style: AppTextStyles.caption(isDark: false).copyWith(
                        color: isActive
                            ? AppColors.primaryLight
                            : AppColors.textPrimaryLight,
                        fontWeight:
                            isActive ? FontWeight.w700 : FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildContent() {
    final l10n = AppLocalizations.of(context)!;

    if (_discoveryResult is NetworkLoading) {
      return const Center(
        child: CircularProgressIndicator(
          valueColor: AlwaysStoppedAnimation<Color>(AppColors.primaryLight),
        ),
      );
    }

    if (_discoveryResult is NetworkError) {
      final error = _discoveryResult as NetworkError<DiscoveryCategoriesResult>;
      return _buildErrorState(error.message);
    }

    if (_categories.isEmpty) {
      return _buildErrorState(l10n.discoveryEmptyCategoryDesc);
    }

    final selected = _selectedCategory;
    if (selected == null) {
      return _buildErrorState(l10n.errorLoading);
    }

    final visibleCampaigns = _visibleCampaigns;
    final canLoadMoreWithoutExpand = selected.campaigns.length <= 10;

    return RefreshIndicator(
      onRefresh: _loadDiscoveryCampaigns,
      color: AppColors.primaryLight,
      child: CustomScrollView(
        slivers: [
          if (_featuredCampaign != null)
            SliverToBoxAdapter(child: _buildEditorsPick()),

          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(24, 24, 24, 16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      l10n.discoveryCuratedForYou,
                      style: AppTextStyles.sectionTitle(isDark: false),
                    ),
                  ),
                  if (!_isSelectedExpanded && selected.campaigns.length > 10)
                    TextButton(
                      onPressed: _expandSelectedCategory,
                      child: Text(
                        l10n.viewAll,
                        style: AppTextStyles.caption(isDark: false).copyWith(
                          color: AppColors.primaryLight,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),

          if (visibleCampaigns.isEmpty)
            SliverToBoxAdapter(child: _buildEmptyCategory(selected))
          else
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(24, 0, 24, 20),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate((context, index) {
                  final campaign = visibleCampaigns[index];
                  return CuratedCampaignCard(
                    campaign: campaign,
                    onTap: () {
                      _logCardOpen(campaign);
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
                }, childCount: visibleCampaigns.length),
              ),
            ),

          if ((_isSelectedExpanded || canLoadMoreWithoutExpand) &&
              (selected.hasMore || _isLoadingMore))
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(24, 0, 24, 100),
                child: _buildLoadMore(selected),
              ),
            )
          else
            const SliverToBoxAdapter(child: SizedBox(height: 100)),
        ],
      ),
    );
  }

  Widget _buildLoadMore(DiscoveryCategorySection selected) {
    final l10n = AppLocalizations.of(context)!;

    if (_isLoadingMore) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.symmetric(vertical: 16),
          child: CircularProgressIndicator(
            valueColor: AlwaysStoppedAnimation<Color>(AppColors.primaryLight),
          ),
        ),
      );
    }

    return Column(
      children: [
        if (_loadMoreError != null)
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Text(
              _loadMoreError!,
              textAlign: TextAlign.center,
              style: AppTextStyles.caption(
                isDark: false,
              ).copyWith(color: AppColors.error),
            ),
          ),
        if (selected.hasMore)
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: _loadMoreForSelectedCategory,
              icon: const Icon(Icons.expand_more),
              label: Text(l10n.viewAll),
            ),
          ),
      ],
    );
  }

  Widget _buildEditorsPick() {
    final l10n = AppLocalizations.of(context)!;
    final campaign = _featuredCampaign;

    if (campaign == null) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 16, 24, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                l10n.discoveryEditorsPick,
                style: AppTextStyles.sectionTitle(isDark: false),
              ),
              const SizedBox(width: 6),
              Icon(Icons.verified, color: AppColors.primaryLight, size: 18),
            ],
          ),
          const SizedBox(height: 12),
          FeaturedCard(
            campaign: campaign,
            onTap: () {
              _logCardOpen(campaign);
              Navigator.of(context).push(
                SlidePageRoute(
                  child: CampaignDetailScreen.fromOpportunity(
                    opportunity: campaign,
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

  Widget _buildEmptyCategory(DiscoveryCategorySection selected) {
    final l10n = AppLocalizations.of(context)!;
    final message = selected.fallbackMessage ?? l10n.discoveryEmptyCategoryDesc;

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
            l10n.discoveryEmptyCategoryTitle,
            style: AppTextStyles.title(isDark: false).copyWith(fontSize: 18),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            message,
            style: AppTextStyles.body(
              isDark: false,
            ).copyWith(color: AppColors.textSecondaryLight, fontSize: 14),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            onPressed: _loadDiscoveryCampaigns,
            icon: const Icon(Icons.refresh),
            label: Text(l10n.refresh),
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
    final l10n = AppLocalizations.of(context)!;
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 64, color: AppColors.error),
            const SizedBox(height: 16),
            Text(
              l10n.errorOccurred,
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
              child: Text(l10n.retry),
            ),
          ],
        ),
      ),
    );
  }
}
