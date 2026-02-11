import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/theme/app_ui_tokens.dart';
import '../../core/utils/network_result.dart';
import '../../core/utils/source_logo_helper.dart';
import '../../core/utils/page_transitions.dart';
import '../../core/l10n/app_localizations.dart';
import '../../data/models/opportunity_model.dart';
import '../../data/repositories/favorite_repository.dart';
import '../home/campaign_detail_screen.dart';
import '../auth/login_screen.dart';
import '../discovery/discovery_screen.dart';

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
  static const Duration _minReloadInterval = Duration(seconds: 2);

  NetworkResult<List<OpportunityModel>> _favoritesResult =
      const NetworkLoading();
  List<OpportunityModel> _favorites = [];
  bool _isLoading = false;
  bool _didInitialize = false;
  DateTime? _lastLoadStartedAt;

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
    if (!force && _lastLoadStartedAt != null) {
      final elapsed = DateTime.now().difference(_lastLoadStartedAt!);
      if (elapsed < _minReloadInterval) {
        return;
      }
    }

    _lastLoadStartedAt = DateTime.now();

    setState(() {
      _isLoading = true;
      _favoritesResult = const NetworkLoading();
    });

    try {
      final result = await _favoriteRepository.getFavorites(force: force);

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
            l10n?.errorLoadingFavorites ?? 'Favoriler yüklenirken hata oluştu',
          );
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _removeFavorite(OpportunityModel campaign) async {
    final l10n = AppLocalizations.of(context)!;
    try {
      final result = await _favoriteRepository.removeFavorite(campaign.id);
      if (result is NetworkSuccess && mounted) {
        setState(() {
          _favorites.removeWhere((c) => c.id == campaign.id);
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(l10n.favoritesRemoved),
            backgroundColor: AppColors.success,
            duration: Duration(seconds: 1),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${l10n.error}: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    // Kullanıcı giriş yapmamışsa login ekranına yönlendir
    if (_auth.currentUser == null) {
      return Scaffold(
        backgroundColor: AppColors.backgroundLight,
        appBar: AppBar(
          backgroundColor: AppColors.backgroundLight,
          elevation: 0,
          automaticallyImplyLeading: false,
          title: Text(
            l10n.favorites,
            style: AppTextStyles.pageTitle(isDark: false),
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
        automaticallyImplyLeading: false,
        title: Text(
          l10n.favorites,
          style: AppTextStyles.pageTitle(isDark: false),
        ),
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
    final l10n = AppLocalizations.of(context)!;
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
              l10n.favoritesLoginPromptTitle,
              style: AppTextStyles.title(isDark: false),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            Text(
              l10n.favoritesLoginPromptDesc,
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
              child: Text(l10n.login),
            ),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: () {
                Navigator.of(context).push(
                  SlidePageRoute(
                    child: const DiscoveryScreen(),
                    direction: SlideDirection.right,
                  ),
                );
              },
              icon: const Icon(Icons.explore, color: AppColors.primaryLight),
              label: Text(
                l10n.exploreCampaigns,
                style: AppTextStyles.button(color: AppColors.primaryLight),
              ),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.primaryLight,
                side: BorderSide(
                  color: AppColors.primaryLight.withValues(alpha: 0.6),
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 14,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBody() {
    final l10n = AppLocalizations.of(context)!;
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
            padding: const EdgeInsets.fromLTRB(
              AppUiTokens.screenPadding,
              12,
              AppUiTokens.screenPadding,
              12,
            ),
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: AppUiTokens.elevatedSurface(),
              child: Text(
                l10n.favoritesHintSaved,
                style: AppTextStyles.subtitle(isDark: false),
              ),
            ),
          ),
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(
                horizontal: AppUiTokens.screenPadding,
              ),
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
      decoration: AppUiTokens.elevatedSurface(),
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
          borderRadius: BorderRadius.circular(AppUiTokens.cardRadius),
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
                      Builder(
                        builder: (context) {
                          String displayText = campaign.subtitle;

                          // Eğer subtitle boş, çok kısa veya anlamsızsa tags'den al
                          if (displayText.isEmpty ||
                              displayText.length < 10 ||
                              displayText.toUpperCase() ==
                                  displayText || // Tamamı büyük harf
                              displayText.contains(RegExp(r'^[A-Z0-9]+$'))) {
                            // Sadece büyük harf ve rakam
                            // Tags'den anlamlı bir açıklama bul
                            if (campaign.tags.isNotEmpty) {
                              displayText = campaign.tags
                                  .where(
                                    (tag) => tag.length > 10,
                                  ) // En az 10 karakter
                                  .take(2)
                                  .join(' • ');
                            }
                          }

                          if (displayText.isEmpty) {
                            return const SizedBox.shrink();
                          }

                          return Text(
                            displayText,
                            style: AppTextStyles.caption(isDark: false)
                                .copyWith(
                                  color: AppColors.textSecondaryLight,
                                  fontSize: 12,
                                ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          );
                        },
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
                  tooltip: AppLocalizations.of(context)!.removeFromFavorites,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    final l10n = AppLocalizations.of(context)!;
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
              l10n.favoritesEmptyTitle,
              style: AppTextStyles.title(isDark: false),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            Text(
              l10n.favoritesEmptyDesc,
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
              child: Text(l10n.retry),
            ),
          ],
        ),
      ),
    );
  }
}
