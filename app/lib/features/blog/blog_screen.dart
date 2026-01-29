import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/utils/network_result.dart';
import '../../core/utils/page_transitions.dart';
import '../../data/models/blog_category_model.dart';
import '../../data/models/blog_post_model.dart';
import '../../data/repositories/blog_repository.dart';

import 'blog_detail_screen.dart';

/// Blog Ekranı
/// Blog yazılarını ve kategorileri gösterir
class BlogScreen extends StatefulWidget {
  const BlogScreen({super.key});

  @override
  State<BlogScreen> createState() => _BlogScreenState();
}

class _BlogScreenState extends State<BlogScreen> {
  final BlogRepository _repository = BlogRepository();
  List<BlogCategoryModel> _categories = [];
  List<BlogPostModel> _posts = [];
  String? _selectedCategorySlug;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    if (_isLoading) return;

    setState(() {
      _isLoading = true;
    });

    final categoriesResult = await _repository.getCategories();
    final postsResult = await _repository.getPosts(featured: false, limit: 20);

    if (mounted) {
      setState(() {
        _isLoading = false;

        if (categoriesResult is NetworkSuccess<List<BlogCategoryModel>>) {
          _categories = categoriesResult.data;
        }

        if (postsResult is NetworkSuccess<List<BlogPostModel>>) {
          _posts = postsResult.data;
        }
      });
    }
  }

  Future<void> _loadPostsByCategory(String? categorySlug) async {
    setState(() {
      _selectedCategorySlug = categorySlug;
      _isLoading = true;
    });

    final result = await _repository.getPosts(
      categorySlug: categorySlug,
      limit: 20,
    );

    if (mounted) {
      setState(() {
        _isLoading = false;

        if (result is NetworkSuccess<List<BlogPostModel>>) {
          _posts = result.data;
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    // Eğer veri yoksa örnek içerik göster
    if (_posts.isEmpty && !_isLoading) {
      return Scaffold(
        backgroundColor: AppColors.backgroundLight,
        appBar: AppBar(
          backgroundColor: AppColors.backgroundLight,
          elevation: 0,
          leading: IconButton(
            icon: const Icon(
              Icons.arrow_back,
              color: AppColors.textPrimaryLight,
            ),
            onPressed: () => Navigator.of(context).pop(),
          ),
          title: Text(
            'Blog & Rehberler',
            style: AppTextStyles.headline(isDark: false),
          ),
          centerTitle: false,
        ),
        body: _buildSampleContent(),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      appBar: AppBar(
        backgroundColor: AppColors.backgroundLight,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.textPrimaryLight),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text(
          'Blog & Rehberler',
          style: AppTextStyles.headline(isDark: false),
        ),
        centerTitle: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: AppColors.textPrimaryLight),
            onPressed: _loadData,
            tooltip: 'Yenile',
          ),
        ],
      ),
      body: _isLoading && _posts.isEmpty
          ? const Center(
              child: CircularProgressIndicator(color: AppColors.primaryLight),
            )
          : RefreshIndicator(
              onRefresh: _loadData,
              color: AppColors.primaryLight,
              child: CustomScrollView(
                slivers: [
                  // Kategoriler
                  if (_categories.isNotEmpty)
                    SliverToBoxAdapter(child: _buildCategoriesSection()),

                  // Öne Çıkan Yazılar
                  if (_posts.any((p) => p.isFeatured))
                    SliverToBoxAdapter(child: _buildFeaturedSection()),

                  // Tüm Yazılar
                  SliverPadding(
                    padding: const EdgeInsets.all(20),
                    sliver: SliverList(
                      delegate: SliverChildBuilderDelegate((context, index) {
                        final post = _posts[index];
                        return _buildPostCard(post);
                      }, childCount: _posts.length),
                    ),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _buildSampleContent() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Bilgi kartı
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.primaryLight.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: AppColors.primaryLight.withValues(alpha: 0.3),
              ),
            ),
            child: Row(
              children: [
                Icon(
                  Icons.info_outline,
                  color: AppColors.primaryLight,
                  size: 20,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Blog içerikleri yakında eklenecek. Şimdilik örnek rehberler mevcut.',
                    style: AppTextStyles.body(
                      isDark: false,
                    ).copyWith(color: AppColors.primaryLight),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),

          // Örnek rehberler
          Text(
            'Faydalı Rehberler',
            style: AppTextStyles.headline(isDark: false).copyWith(fontSize: 20),
          ),

          const SizedBox(height: 16),

          _buildSampleGuideCard(
            'Nasıl Daha Çok Tasarruf Ederim?',
            'Günlük alışverişlerinizde tasarruf etmenin 10 etkili yolu',
            Icons.savings,
            AppColors.success,
          ),

          _buildSampleGuideCard(
            'Kampanya Takibi İpuçları',
            'En iyi kampanyaları kaçırmamak için bilmeniz gerekenler',
            Icons.lightbulb,
            AppColors.warning,
          ),

          _buildSampleGuideCard(
            'Güvenli Online Alışveriş',
            'İnternetten alışveriş yaparken dikkat edilmesi gerekenler',
            Icons.security,
            AppColors.primaryLight,
          ),

          _buildSampleGuideCard(
            'Bütçe Yönetimi',
            'Aylık bütçenizi nasıl daha iyi yönetebilirsiniz',
            Icons.account_balance_wallet,
            AppColors.error,
          ),
        ],
      ),
    );
  }

  Widget _buildSampleGuideCard(
    String title,
    String description,
    IconData icon,
    Color color,
  ) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: AppColors.cardBackground,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: AppColors.shadowDark.withValues(alpha: 0.1),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: InkWell(
        onTap: () {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('$title - Yakında eklenecek!'),
              backgroundColor: color,
            ),
          );
        },
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: color, size: 24),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: AppTextStyles.body(
                        isDark: false,
                      ).copyWith(fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      description,
                      style: AppTextStyles.caption(
                        isDark: false,
                      ).copyWith(color: AppColors.textSecondaryLight),
                    ),
                  ],
                ),
              ),
              Icon(
                Icons.arrow_forward_ios,
                size: 16,
                color: AppColors.textSecondaryLight,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCategoriesSection() {
    return Container(
      height: 100,
      margin: const EdgeInsets.symmetric(vertical: 16),
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 20),
        itemCount: _categories.length + 1, // +1 for "Tümü"
        itemBuilder: (context, index) {
          if (index == 0) {
            // "Tümü" kategorisi
            final isSelected = _selectedCategorySlug == null;
            return Padding(
              padding: const EdgeInsets.only(right: 12),
              child: _buildCategoryChip(
                name: 'Tümü',
                isSelected: isSelected,
                onTap: () => _loadPostsByCategory(null),
              ),
            );
          }

          final category = _categories[index - 1];
          final isSelected = _selectedCategorySlug == category.slug;

          return Padding(
            padding: const EdgeInsets.only(right: 12),
            child: _buildCategoryChip(
              name: category.name,
              iconName: category.iconName,
              color: category.color,
              isSelected: isSelected,
              onTap: () => _loadPostsByCategory(category.slug),
            ),
          );
        },
      ),
    );
  }

  Widget _buildCategoryChip({
    required String name,
    String? iconName,
    String? color,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    final chipColor = color != null
        ? Color(int.parse(color.replaceFirst('#', '0xFF')))
        : AppColors.primaryLight;

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        decoration: BoxDecoration(
          color: isSelected
              ? chipColor.withValues(alpha: 0.2)
              : AppColors.surfaceLight,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected
                ? chipColor
                : AppColors.textSecondaryLight.withValues(alpha: 0.2),
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (iconName != null) ...[
              Icon(
                _getIconData(iconName),
                size: 18,
                color: isSelected ? chipColor : AppColors.textSecondaryLight,
              ),
              const SizedBox(width: 8),
            ],
            Text(
              name,
              style: AppTextStyles.body(isDark: false).copyWith(
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                color: isSelected ? chipColor : AppColors.textPrimaryLight,
              ),
            ),
          ],
        ),
      ),
    );
  }

  IconData _getIconData(String iconName) {
    switch (iconName) {
      case 'lightbulb':
        return Icons.lightbulb;
      case 'savings':
        return Icons.savings;
      case 'category':
        return Icons.category;
      case 'people':
        return Icons.people;
      default:
        return Icons.article;
    }
  }

  Widget _buildFeaturedSection() {
    final featuredPosts = _posts.where((p) => p.isFeatured).toList();

    if (featuredPosts.isEmpty) {
      return const SizedBox.shrink();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
          child: Row(
            children: [
              Icon(Icons.star, color: AppColors.warning, size: 20),
              const SizedBox(width: 8),
              Text(
                'Öne Çıkanlar',
                style: AppTextStyles.headline(
                  isDark: false,
                ).copyWith(fontSize: 18),
              ),
            ],
          ),
        ),
        SizedBox(
          height: 200,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 20),
            itemCount: featuredPosts.length,
            itemBuilder: (context, index) {
              final post = featuredPosts[index];
              return Container(
                width: 280,
                margin: const EdgeInsets.only(right: 12),
                child: _buildPostCard(post, isCompact: true),
              );
            },
          ),
        ),
        const SizedBox(height: 20),
      ],
    );
  }

  Widget _buildPostCard(BlogPostModel post, {bool isCompact = false}) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: AppColors.cardBackground,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: AppColors.shadowDark.withValues(alpha: 0.1),
            blurRadius: 12,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: InkWell(
        onTap: () {
          Navigator.of(context).push(
            SlidePageRoute(
              child: BlogDetailScreen(post: post),
              direction: SlideDirection.left,
            ),
          );
        },
        borderRadius: BorderRadius.circular(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Featured Image
            if (post.featuredImageUrl != null &&
                post.featuredImageUrl!.isNotEmpty)
              ClipRRect(
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(20),
                ),
                child: Image.network(
                  post.featuredImageUrl!,
                  height: isCompact ? 120 : 180,
                  width: double.infinity,
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) {
                    return Container(
                      height: isCompact ? 120 : 180,
                      color: AppColors.surfaceLight,
                      child: Icon(
                        Icons.image_not_supported,
                        color: AppColors.textSecondaryLight,
                      ),
                    );
                  },
                ),
              ),

            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Kategori ve Tarih
                  Row(
                    children: [
                      if (post.category != null) ...[
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: post.category!.color != null
                                ? Color(
                                    int.parse(
                                      post.category!.color!.replaceFirst(
                                        '#',
                                        '0xFF',
                                      ),
                                    ),
                                  )
                                : AppColors.primaryLight.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            post.category!.name,
                            style: AppTextStyles.caption(isDark: false)
                                .copyWith(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                ),
                          ),
                        ),
                        const SizedBox(width: 8),
                      ],
                      if (post.publishedAt != null) ...[
                        Icon(
                          Icons.calendar_today,
                          size: 12,
                          color: AppColors.textSecondaryLight,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          DateFormat(
                            'dd MMM yyyy',
                            'tr_TR',
                          ).format(post.publishedAt!),
                          style: AppTextStyles.caption(isDark: false).copyWith(
                            fontSize: 11,
                            color: AppColors.textSecondaryLight,
                          ),
                        ),
                      ],
                    ],
                  ),

                  const SizedBox(height: 12),

                  // Başlık
                  Text(
                    post.title,
                    style: AppTextStyles.body(isDark: false).copyWith(
                      fontWeight: FontWeight.bold,
                      fontSize: isCompact ? 14 : 16,
                    ),
                    maxLines: isCompact ? 2 : 3,
                    overflow: TextOverflow.ellipsis,
                  ),

                  if (post.excerpt != null && post.excerpt!.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Text(
                      post.excerpt!,
                      style: AppTextStyles.body(isDark: false).copyWith(
                        fontSize: isCompact ? 12 : 14,
                        color: AppColors.textSecondaryLight,
                      ),
                      maxLines: isCompact ? 2 : 3,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],

                  const SizedBox(height: 12),

                  // Footer
                  Row(
                    children: [
                      Icon(
                        Icons.person_outline,
                        size: 14,
                        color: AppColors.textSecondaryLight,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        post.authorName,
                        style: AppTextStyles.caption(
                          isDark: false,
                        ).copyWith(color: AppColors.textSecondaryLight),
                      ),
                      const Spacer(),
                      Icon(
                        Icons.visibility_outlined,
                        size: 14,
                        color: AppColors.textSecondaryLight,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '${post.viewCount}',
                        style: AppTextStyles.caption(
                          isDark: false,
                        ).copyWith(color: AppColors.textSecondaryLight),
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
  }
}
