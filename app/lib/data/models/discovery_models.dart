import 'opportunity_model.dart';

class DiscoveryCategorySection {
  final String id;
  final String name;
  final String icon;
  final List<String> sources;
  final int minCampaigns;
  final List<OpportunityModel> campaigns;
  final int count;
  final int totalCount;
  final bool hasMore;
  final bool isEmpty;
  final String? fallbackMessage;

  const DiscoveryCategorySection({
    required this.id,
    required this.name,
    required this.icon,
    required this.sources,
    required this.minCampaigns,
    required this.campaigns,
    required this.count,
    required this.totalCount,
    required this.hasMore,
    required this.isEmpty,
    required this.fallbackMessage,
  });

  DiscoveryCategorySection copyWith({
    List<OpportunityModel>? campaigns,
    int? count,
    int? totalCount,
    bool? hasMore,
    bool? isEmpty,
    String? fallbackMessage,
  }) {
    return DiscoveryCategorySection(
      id: id,
      name: name,
      icon: icon,
      sources: sources,
      minCampaigns: minCampaigns,
      campaigns: campaigns ?? this.campaigns,
      count: count ?? this.count,
      totalCount: totalCount ?? this.totalCount,
      hasMore: hasMore ?? this.hasMore,
      isEmpty: isEmpty ?? this.isEmpty,
      fallbackMessage: fallbackMessage ?? this.fallbackMessage,
    );
  }
}

class DiscoveryCategoriesResult {
  final List<DiscoveryCategorySection> categories;
  final int totalCategories;
  final int perCategoryLimit;

  const DiscoveryCategoriesResult({
    required this.categories,
    required this.totalCategories,
    required this.perCategoryLimit,
  });
}

class DiscoveryCategoryPageResult {
  final DiscoveryCategorySection category;
  final List<OpportunityModel> campaigns;
  final int count;
  final int totalCount;
  final bool hasMore;
  final bool isEmpty;
  final String? fallbackMessage;
  final int limit;
  final int offset;

  const DiscoveryCategoryPageResult({
    required this.category,
    required this.campaigns,
    required this.count,
    required this.totalCount,
    required this.hasMore,
    required this.isEmpty,
    required this.fallbackMessage,
    required this.limit,
    required this.offset,
  });
}
