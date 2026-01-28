import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/utils/network_result.dart';
import '../../data/models/leaderboard_model.dart';
import '../../data/models/community_stats_model.dart';
import '../../data/repositories/community_repository.dart';
import '../../core/widgets/empty_state.dart';

/// Topluluk Ekranı - Leaderboard ve Topluluk İstatistikleri
class CommunityScreen extends StatefulWidget {
  const CommunityScreen({super.key});

  @override
  State<CommunityScreen> createState() => _CommunityScreenState();
}

class _CommunityScreenState extends State<CommunityScreen> {
  final CommunityRepository _repository = CommunityRepository();
  NetworkResult<List<LeaderboardModel>>? _leaderboardResult;
  NetworkResult<CommunityStatsModel>? _statsResult;
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

    final leaderboardResult = await _repository.getLeaderboard(limit: 20);
    final statsResult = await _repository.getCommunityStats();

    if (mounted) {
      setState(() {
        _leaderboardResult = leaderboardResult;
        _statsResult = statsResult;
        _isLoading = false;
      });
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
        title: Text(
          'Topluluk',
          style: AppTextStyles.heading(isDark: false),
        ),
        centerTitle: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: AppColors.textPrimaryLight),
            onPressed: _loadData,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(
                color: AppColors.primaryLight,
              ),
            )
          : RefreshIndicator(
              onRefresh: _loadData,
              color: AppColors.primaryLight,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Topluluk İstatistikleri
                    _buildCommunityStats(),
                    const SizedBox(height: 24),
                    // Leaderboard
                    _buildLeaderboard(),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildCommunityStats() {
    if (_statsResult is NetworkError) {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.error.withOpacity(0.1),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          children: [
            Icon(Icons.error_outline, color: AppColors.error, size: 20),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                (_statsResult as NetworkError).message,
                style: AppTextStyles.caption(isDark: false).copyWith(
                  color: AppColors.error,
                ),
              ),
            ),
          ],
        ),
      );
    }

    if (_statsResult is! NetworkSuccess<CommunityStatsModel>) {
      return const SizedBox.shrink();
    }

    final stats = (_statsResult as NetworkSuccess<CommunityStatsModel>).data;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppColors.primaryLight,
            AppColors.primaryLight.withOpacity(0.8),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: AppColors.primaryLight.withOpacity(0.3),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  Icons.people,
                  color: Colors.white,
                  size: 24,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Topluluk İstatistikleri',
                      style: AppTextStyles.heading(isDark: false).copyWith(
                        color: Colors.white,
                        fontSize: 20,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${stats.totalUsers} aktif kullanıcı',
                      style: AppTextStyles.body(isDark: false).copyWith(
                        color: Colors.white.withOpacity(0.9),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          // İstatistik Grid
          Row(
            children: [
              Expanded(
                child: _buildStatItem(
                  icon: Icons.favorite,
                  label: 'Favoriler',
                  value: stats.totalFavorites.toString(),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildStatItem(
                  icon: Icons.comment,
                  label: 'Yorumlar',
                  value: stats.totalComments.toString(),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _buildStatItem(
                  icon: Icons.star,
                  label: 'Puanlar',
                  value: stats.totalRatings.toString(),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildStatItem(
                  icon: Icons.emoji_events,
                  label: 'Rozetler',
                  value: stats.totalBadges.toString(),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem({
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.2),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Icon(icon, color: Colors.white, size: 20),
          const SizedBox(height: 8),
          Text(
            value,
            style: AppTextStyles.body(isDark: false).copyWith(
              color: Colors.white,
              fontWeight: FontWeight.bold,
              fontSize: 18,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: AppTextStyles.caption(isDark: false).copyWith(
              color: Colors.white.withOpacity(0.9),
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildLeaderboard() {
    if (_leaderboardResult is NetworkError) {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.error.withOpacity(0.1),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          children: [
            Icon(Icons.error_outline, color: AppColors.error, size: 20),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                (_leaderboardResult as NetworkError).message,
                style: AppTextStyles.caption(isDark: false).copyWith(
                  color: AppColors.error,
                ),
              ),
            ),
          ],
        ),
      );
    }

    if (_leaderboardResult is! NetworkSuccess<List<LeaderboardModel>>) {
      return const SizedBox.shrink();
    }

    final leaderboard = (_leaderboardResult as NetworkSuccess<List<LeaderboardModel>>).data;

    if (leaderboard.isEmpty) {
      return AppEmptyState(
        icon: Icons.leaderboard_outlined,
        title: 'Henüz lider yok',
        description: 'İlk aktivitelerini yaparak liderlik tablosuna girebilirsin!',
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Liderlik Tablosu',
          style: AppTextStyles.heading(isDark: false).copyWith(
            fontSize: 20,
          ),
        ),
        const SizedBox(height: 16),
        ...leaderboard.asMap().entries.map((entry) {
          final index = entry.key;
          final user = entry.value;
          return _buildLeaderboardItem(user, index);
        }),
      ],
    );
  }

  Widget _buildLeaderboardItem(LeaderboardModel user, int index) {
    // İlk 3 için özel renkler
    Color rankColor;
    IconData rankIcon;
    if (index == 0) {
      rankColor = const Color(0xFFFFD700); // Altın
      rankIcon = Icons.looks_one;
    } else if (index == 1) {
      rankColor = const Color(0xFFC0C0C0); // Gümüş
      rankIcon = Icons.looks_two;
    } else if (index == 2) {
      rankColor = const Color(0xFFCD7F32); // Bronz
      rankIcon = Icons.looks_3;
    } else {
      rankColor = AppColors.textSecondaryLight;
      rankIcon = Icons.circle;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: user.isCurrentUser
            ? AppColors.primaryLight.withOpacity(0.1)
            : AppColors.surfaceLight,
        borderRadius: BorderRadius.circular(16),
        border: user.isCurrentUser
            ? Border.all(
                color: AppColors.primaryLight,
                width: 2,
              )
            : null,
      ),
      child: Row(
        children: [
          // Sıra
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: rankColor.withOpacity(0.2),
              shape: BoxShape.circle,
            ),
            child: Center(
              child: index < 3
                  ? Icon(rankIcon, color: rankColor, size: 24)
                  : Text(
                      '${index + 1}',
                      style: AppTextStyles.body(isDark: false).copyWith(
                        color: rankColor,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
            ),
          ),
          const SizedBox(width: 16),
          // Kullanıcı Bilgileri
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      'Kullanıcı ${user.userId.substring(0, 8)}...',
                      style: AppTextStyles.body(isDark: false).copyWith(
                        fontWeight: FontWeight.bold,
                        color: user.isCurrentUser
                            ? AppColors.primaryLight
                            : AppColors.textPrimaryLight,
                      ),
                    ),
                    if (user.isCurrentUser) ...[
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: AppColors.primaryLight,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          'Sen',
                          style: AppTextStyles.caption(isDark: false).copyWith(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Icon(
                      Icons.emoji_events,
                      size: 14,
                      color: AppColors.textSecondaryLight,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      'Seviye ${user.level}',
                      style: AppTextStyles.caption(isDark: false).copyWith(
                        color: AppColors.textSecondaryLight,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Icon(
                      Icons.star,
                      size: 14,
                      color: AppColors.textSecondaryLight,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '${user.points} puan',
                      style: AppTextStyles.caption(isDark: false).copyWith(
                        color: AppColors.textSecondaryLight,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          // Rozet Sayısı
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: AppColors.primaryLight.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: [
                Icon(
                  Icons.emoji_events,
                  size: 16,
                  color: AppColors.primaryLight,
                ),
                const SizedBox(width: 4),
                Text(
                  '${user.badgeCount}',
                  style: AppTextStyles.caption(isDark: false).copyWith(
                    color: AppColors.primaryLight,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
