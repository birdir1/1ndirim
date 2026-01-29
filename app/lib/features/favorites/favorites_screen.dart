import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/utils/network_result.dart';
import '../../core/utils/source_logo_helper.dart';
import '../../core/utils/page_transitions.dart';
import '../../core/l10n/app_localizations.dart';
import '../../data/models/opportunity_model.dart';
import '../../data/repositories/favorite_repository.dart';
import '../home/campaign_detail_screen.dart';
import '../auth/login_screen.dart';

/// Favoriler Sayfası
/// Kullanıcının favori kampanyalarını gösterir
class FavoritesScreen extends StatefulWidget {
  const FavoritesScreen({super.key});

  @override
  State<FavoritesScreen> createState() => _FavoritesScreenState();
}

class _FavoritesScreenState extends State<FavoritesScreen> {
  final FavoriteRepository _favoriteRepository = FavoriteRepository.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;

  NetworkResult<List<OpportunityModel>> _favoritesResult =
      const NetworkLoading();
  List<OpportunityModel> _favorites = [];
  bool _isLoading = false;
  bool _didInitialize = false;

  @override
  void initState() {
    super.initState();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_didInitialize) {
      _didInitialize = true;
      _checkAuthAndLoadFavorites();
    }
  }

  Future<void> _checkAuthAndLoadFavorites() async {
    if (_auth.currentUser == null) {
      return;
    }
    await _loadFavorites();
  }

  Future<void> _loadFavorites({bool force = false}) async {
    if (!mounted || (_isLoading && !force)) return;

    setState(() {
      _isLoading = true;
      _favoritesResult = const NetworkLoading();
    });

    try {
      final result = await _favoriteRepository.getFavorites();

      if (mounted) {
        setState(() {
          _favoritesResult = result;
          _isLoading = false;
          if (result is NetworkSuccess<List<OpportunityModel>>) {
            _favorites = result.data;
          }
        });
      }
    } catch (e) {
      if (mounted) {
        final l10n = AppLocalizations.of(context);
        setState(() {
          _favoritesResult = NetworkError.general(
            l10n?.errorLoadingFavorites ??
                'Favoriler yüklenirken bir hata oluştu',
          );
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _removeFavorite(OpportunityModel campaign) async {
    try {
      final result = await _favoriteRepository.removeFavorite(campaign.id);
      if (result is NetworkSuccess && mounted) {
        setState(() {
          _favorites.removeWhere((c) => c.id == campaign.id);
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Favorilerden kaldırıldı'),
            backgroundColor: AppColors.success,
            duration: Duration(seconds: 1),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Hata: $e'), backgroundColor: AppColors.error),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    // Kullanıcı giriş yapmamışsa login ekranına yönlendir
    if (_auth.currentUser == null) {
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
            'Favoriler',
            style: AppTextStyles.headline(isDark: false),
          ),
          centerTitle: true,
        ),
        body: _buildLoginRequired(),
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
        title: Text('Favoriler', style: AppTextStyles.headline(isDark: false)),
        centerTitle: true,
      ),
      body: RefreshIndicator(
        onRefresh: () => _loadFavorites(force: true),
        color: AppColors.primaryLight,
        child: _buildBody(),
      ),
    );
  }

  Widget _buildLoginRequired() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                color: AppColors.primaryLight.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.favorite_border,
                size: 60,
                color: AppColors.primaryLight,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'Giriş Yapın',
              style: AppTextStyles.title(isDark: false),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            Text(
              'Favorilerinizi görmek için giriş yapmanız gerekiyor',
              style: AppTextStyles.body(
                isDark: false,
              ).copyWith(color: AppColors.textSecondaryLight),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            ElevatedButton(
              onPressed: () {
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (context) => const LoginScreen()),
                );
              },
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
              child: const Text('Giriş Yap'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBody() {
    if (_favoritesResult is NetworkLoading) {
      return const Center(
        child: CircularProgressIndicator(
          valueColor: AlwaysStoppedAnimation<Color>(AppColors.primaryLight),
        ),
      );
    }

    if (_favoritesResult is NetworkError) {
      final error = _favoritesResult as NetworkError<List<OpportunityModel>>;
      return _buildErrorState(error.message);
    }

    if (_favoritesResult is NetworkSuccess<List<OpportunityModel>>) {
      if (_favorites.isEmpty) {
        return _buildEmptyState();
      }

      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 16),
            child: Text(
              'Kaydettiğin tüm fırsatlar burada.',
              style: AppTextStyles.title(isDark: false).copyWith(fontSize: 20),
            ),
          ),
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              itemCount: _favorites.length,
              itemBuilder: (context, index) {
                final campaign = _favorites[index];
                return _buildFavoriteCard(campaign);
              },
            ),
          ),
        ],
      );
    }

    return const SizedBox.shrink();
  }

  Widget _buildFavoriteCard(OpportunityModel campaign) {
    final sourceColor = SourceLogoHelper.getLogoBackgroundColor(
      campaign.sourceName,
    );

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: AppColors.shadowDark.withValues(alpha: 0.08),
            blurRadius: 12,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
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
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                // Logo
                Container(
                  width: 64,
                  height: 64,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: sourceColor.withValues(alpha: 0.3),
                      width: 2,
                    ),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(10),
                    child: SourceLogoHelper.getLogoWidget(
                      campaign.sourceName,
                      width: 44,
                      height: 44,
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                // Content
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        campaign.sourceName,
                        style: AppTextStyles.caption(isDark: false).copyWith(
                          color: AppColors.textSecondaryLight,
                          fontSize: 12,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        campaign.title,
                        style: AppTextStyles.body(isDark: false).copyWith(
                          fontWeight: FontWeight.w600,
                          color: AppColors.primaryLight,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        campaign.subtitle,
                        style: AppTextStyles.caption(isDark: false).copyWith(
                          color: AppColors.textSecondaryLight,
                          fontSize: 12,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                // Favorite button
                IconButton(
                  onPressed: () => _removeFavorite(campaign),
                  icon: const Icon(
                    Icons.favorite,
                    color: AppColors.primaryLight,
                    size: 28,
                  ),
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                color: AppColors.primaryLight.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.favorite_border,
                size: 60,
                color: AppColors.primaryLight.withValues(alpha: 0.5),
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'Henüz favorin yok',
              style: AppTextStyles.title(isDark: false),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            Text(
              'Beğendiğin fırsatları kalbe basarak buraya ekleyebilirsin.',
              style: AppTextStyles.body(
                isDark: false,
              ).copyWith(color: AppColors.textSecondaryLight),
              textAlign: TextAlign.center,
            ),
          ],
        ),
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
              onPressed: () => _loadFavorites(force: true),
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
