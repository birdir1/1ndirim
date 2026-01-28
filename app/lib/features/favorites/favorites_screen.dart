import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/empty_state.dart' show AppEmptyState;
import '../../core/utils/network_result.dart';
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
  
  NetworkResult<List<OpportunityModel>> _favoritesResult = const NetworkLoading();
  List<OpportunityModel> _favorites = [];
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _checkAuthAndLoadFavorites();
  }

  /// Kullanıcı giriş kontrolü ve favorileri yükle
  Future<void> _checkAuthAndLoadFavorites() async {
    if (_auth.currentUser == null) {
      setState(() {
        _favoritesResult = NetworkError.general('Giriş yapmanız gerekiyor');
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
        setState(() {
          _favoritesResult = NetworkError.general('Favoriler yüklenirken bir hata oluştu');
          _isLoading = false;
        });
      }
    }
  }

  /// Favoriden çıkarıldığında listeden kaldır
  void _onFavoriteRemoved(String campaignId) {
    setState(() {
      _favorites.removeWhere((campaign) => campaign.id == campaignId);
      _favoritesResult = NetworkSuccess(_favorites);
    });
  }

  @override
  Widget build(BuildContext context) {
    // Kullanıcı giriş yapmamışsa login ekranına yönlendir
    if (_auth.currentUser == null) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Favorilerim'),
          backgroundColor: Colors.white,
          elevation: 0,
        ),
        body: AppEmptyState(
          icon: Icons.favorite_border,
          title: 'Giriş Yapın',
          description: 'Favorilerinizi görmek için giriş yapmanız gerekiyor',
          actionText: 'Giriş Yap',
          onAction: () {
            Navigator.of(context).push(
              MaterialPageRoute(
                builder: (context) => const LoginScreen(),
              ),
            );
          },
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Favorilerim',
          style: TextStyle(
            fontWeight: FontWeight.w700,
            fontSize: 24,
          ),
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
                  valueColor: AlwaysStoppedAnimation<Color>(AppColors.discountRed),
                ),
              ),
            )
          else
            IconButton(
              icon: const Icon(Icons.refresh),
              onPressed: () => _loadFavorites(force: true),
              tooltip: 'Yenile',
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
        title: 'Bir Hata Oluştu',
        description: error.message,
        actionText: 'Tekrar Dene',
        onAction: () => _loadFavorites(force: true),
      );
    }

    if (_favoritesResult is NetworkSuccess<List<OpportunityModel>>) {
      if (_favorites.isEmpty) {
        return AppEmptyState(
          icon: Icons.favorite_border,
          title: 'Henüz Favoriniz Yok',
          description: 'Beğendiğiniz kampanyaları favorilere ekleyerek burada görebilirsiniz',
          actionText: 'Kampanyaları Keşfet',
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
