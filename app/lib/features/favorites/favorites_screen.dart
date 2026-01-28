import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/empty_state.dart' show AppEmptyState;
import '../../core/utils/network_result.dart';
import '../../core/l10n/app_localizations.dart';
import '../../data/models/opportunity_model.dart';
import '../../data/repositories/favorite_repository.dart';
import '../home/widgets/opportunity_card_v2.dart';
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

  @override
  void initState() {
    super.initState();
    _checkAuthAndLoadFavorites();
  }

  /// Kullanıcı giriş kontrolü ve favorileri yükle
  Future<void> _checkAuthAndLoadFavorites() async {
    final l10n = AppLocalizations.of(context);
    if (_auth.currentUser == null) {
      setState(() {
        _favoritesResult = NetworkError.general(
          l10n?.loginRequired ?? 'Giriş yapmanız gerekiyor',
        );
      });
      return;
    }

    await _loadFavorites();
  }

  /// Favorileri yükle
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

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);

    // Kullanıcı giriş yapmamışsa login ekranına yönlendir
    if (_auth.currentUser == null) {
      return Scaffold(
        appBar: AppBar(
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () => Navigator.of(context).pop(),
          ),
          title: Text(l10n?.myFavorites ?? 'Favorilerim'),
          backgroundColor: Colors.white,
          elevation: 0,
        ),
        body: AppEmptyState(
          icon: Icons.favorite_border,
          title: l10n?.signIn ?? 'Giriş Yapın',
          description:
              l10n?.loginRequiredForFavorites ??
              'Favorilerinizi görmek için giriş yapmanız gerekiyor',
          actionText: l10n?.signIn ?? 'Giriş Yap',
          onAction: () {
            Navigator.of(context).push(
              MaterialPageRoute(builder: (context) => const LoginScreen()),
            );
          },
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text(
          l10n?.myFavorites ?? 'Favorilerim',
          style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 24),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        actions: [
          if (_isLoading)
            const Padding(
              padding: EdgeInsets.all(16.0),
              child: SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor: AlwaysStoppedAnimation<Color>(
                    AppColors.discountRed,
                  ),
                ),
              ),
            )
          else
            IconButton(
              icon: const Icon(Icons.refresh),
              onPressed: () => _loadFavorites(force: true),
              tooltip: l10n?.refresh ?? 'Yenile',
            ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => _loadFavorites(force: true),
        color: AppColors.discountRed,
        child: _buildBody(),
      ),
    );
  }

  Widget _buildBody() {
    final l10n = AppLocalizations.of(context);

    if (_favoritesResult is NetworkLoading) {
      return const Center(
        child: CircularProgressIndicator(
          valueColor: AlwaysStoppedAnimation<Color>(AppColors.discountRed),
        ),
      );
    }

    if (_favoritesResult is NetworkError) {
      final error = _favoritesResult as NetworkError<List<OpportunityModel>>;
      return AppEmptyState(
        icon: Icons.error_outline,
        title: l10n?.errorOccurred ?? 'Bir Hata Oluştu',
        description: error.message,
        actionText: l10n?.retry ?? 'Tekrar Dene',
        onAction: () => _loadFavorites(force: true),
      );
    }

    if (_favoritesResult is NetworkSuccess<List<OpportunityModel>>) {
      if (_favorites.isEmpty) {
        return AppEmptyState(
          icon: Icons.favorite_border,
          title: l10n?.noFavoritesYet ?? 'Henüz Favoriniz Yok',
          description:
              l10n?.noFavoritesDescription ??
              'Beğendiğiniz kampanyaları favorilere ekleyerek burada görebilirsiniz',
          actionText: l10n?.exploreCampaigns ?? 'Kampanyaları Keşfet',
          onAction: () {
            Navigator.of(context).pop();
          },
        );
      }

      return ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _favorites.length,
        itemBuilder: (context, index) {
          final campaign = _favorites[index];
          return OpportunityCardV2(
            opportunity: campaign,
            isFavorite: true, // Favori sayfasında olduğu için true
          );
        },
      );
    }

    return const SizedBox.shrink();
  }
}
