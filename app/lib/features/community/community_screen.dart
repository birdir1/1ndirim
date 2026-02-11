import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/theme/app_ui_tokens.dart';
import '../../core/l10n/app_localizations.dart';
import '../../core/utils/network_result.dart';
import '../../data/models/leaderboard_model.dart';
import '../../data/models/community_stats_model.dart';
import '../../data/repositories/community_repository.dart';
import '../../core/widgets/empty_state.dart';
import '../../core/widgets/screen_shell.dart';
import '../../core/widgets/section_card.dart';

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
    final l10n = AppLocalizations.of(context)!;
    return ScreenShell(
      title: l10n.community,
      actions: [
        IconButton(
          icon: const Icon(Icons.refresh, color: AppColors.textPrimaryLight),
          onPressed: _loadData,
          tooltip: l10n.refresh,
        ),
      ],
      child: _isLoading
          ? const Center(
              child: CircularProgressIndicator(color: AppColors.primaryLight),
            )
          : RefreshIndicator(
              onRefresh: _loadData,
              color: AppColors.primaryLight,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.only(bottom: 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildCommunityStats(),
                    const SizedBox(height: AppUiTokens.sectionGap),
                    _buildLeaderboard(),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildCommunityStats() {
    if (_statsResult is NetworkError) {
      return SectionCard(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Icon(Icons.info_outline, color: AppColors.warning, size: 20),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                'Topluluk istatistikleri şu anda yüklenemiyor. Lütfen daha sonra tekrar deneyin.',
                style: AppTextStyles.caption(
                  isDark: false,
                ).copyWith(color: AppColors.warning),
              ),
            ),
          ],
        ),
      );
    }

    if (_statsResult is! NetworkSuccess<CommunityStatsModel>) {
      return _buildSampleStats();
    }

    final stats = (_statsResult as NetworkSuccess<CommunityStatsModel>).data;
    return _buildStatsContainer(
      totalUsers: stats.totalUsers,
      totalFavorites: stats.totalFavorites,
      totalComments: stats.totalComments,
      totalRatings: stats.totalRatings,
      totalBadges: stats.totalBadges,
    );
  }

  Widget _buildSampleStats() {
    return _buildStatsContainer(
      totalUsers: 1234,
      totalFavorites: 5678,
      totalComments: 2345,
      totalRatings: 8901,
      totalBadges: 456,
    );
  }

  Widget _buildStatsContainer({
    required int totalUsers,
    required int totalFavorites,
    required int totalComments,
    required int totalRatings,
    required int totalBadges,
  }) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppColors.primaryLight,
            AppColors.primaryLight.withValues(alpha: 0.8),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: AppColors.primaryLight.withValues(alpha: 0.3),
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
                  color: Colors.white.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.people, color: Colors.white, size: 24),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Topluluk İstatistikleri',
                      style: AppTextStyles.headline(
                        isDark: false,
                      ).copyWith(color: Colors.white, fontSize: 20),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '$totalUsers aktif kullanıcı',
                      style: AppTextStyles.body(
                        isDark: false,
                      ).copyWith(color: Colors.white.withValues(alpha: 0.9)),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: _buildStatItem(
                  icon: Icons.favorite,
                  label: 'Favoriler',
                  value: totalFavorites.toString(),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildStatItem(
                  icon: Icons.comment,
                  label: 'Yorumlar',
                  value: totalComments.toString(),
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
                  value: totalRatings.toString(),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildStatItem(
                  icon: Icons.emoji_events,
                  label: 'Rozetler',
                  value: totalBadges.toString(),
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
        color: Colors.white.withValues(alpha: 0.2),
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
            style: AppTextStyles.caption(
              isDark: false,
            ).copyWith(color: Colors.white.withValues(alpha: 0.9)),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildLeaderboard() {
    if (_leaderboardResult is NetworkError) {
      return SectionCard(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Icon(Icons.info_outline, color: AppColors.warning, size: 20),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                'Liderlik tablosu şu anda yüklenemiyor. Lütfen daha sonra tekrar deneyin.',
                style: AppTextStyles.caption(
                  isDark: false,
                ).copyWith(color: AppColors.warning),
              ),
            ),
          ],
        ),
      );
    }

    if (_leaderboardResult is! NetworkSuccess<List<LeaderboardModel>>) {
      return _buildSampleLeaderboard();
    }

    final leaderboard =
        (_leaderboardResult as NetworkSuccess<List<LeaderboardModel>>).data;

    if (leaderboard.isEmpty) {
      return AppEmptyState(
        icon: Icons.leaderboard_outlined,
        title: 'Henüz lider yok',
        description:
            'İlk aktivitelerini yaparak liderlik tablosuna girebilirsin!',
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Liderlik Tablosu',
          style: AppTextStyles.headline(isDark: false).copyWith(fontSize: 20),
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

  Widget _buildSampleLeaderboard() {
    final sampleUsers = [
      {
        'name': 'TasarrufKrali',
        'level': 15,
        'points': 2450,
        'badges': 12,
        'isMe': false,
      },
      {
        'name': 'KampanyaAvcısı',
        'level': 12,
        'points': 1890,
        'badges': 8,
        'isMe': false,
      },
      {'name': 'Sen', 'level': 8, 'points': 1234, 'badges': 5, 'isMe': true},
      {
        'name': 'İndirimSever',
        'level': 10,
        'points': 1567,
        'badges': 7,
        'isMe': false,
      },
      {
        'name': 'FırsatBulur',
        'level': 6,
        'points': 890,
        'badges': 4,
        'isMe': false,
      },
    ];

    sampleUsers.sort(
      (a, b) => (b['points'] as int).compareTo(a['points'] as int),
    );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Liderlik Tablosu',
          style: AppTextStyles.headline(isDark: false).copyWith(fontSize: 20),
        ),
        const SizedBox(height: 16),
        ...sampleUsers.asMap().entries.map((entry) {
          final index = entry.key;
          final user = entry.value;
          return _buildSampleLeaderboardItem(user, index);
        }),
      ],
    );
  }

  Widget _buildLeaderboardItem(LeaderboardModel user, int index) {
    Color rankColor;
    IconData rankIcon;
    if (index == 0) {
      rankColor = const Color(0xFFFFD700);
      rankIcon = Icons.looks_one;
    } else if (index == 1) {
      rankColor = const Color(0xFFC0C0C0);
      rankIcon = Icons.looks_two;
    } else if (index == 2) {
      rankColor = const Color(0xFFCD7F32);
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
            ? AppColors.primaryLight.withValues(alpha: 0.1)
            : AppColors.surfaceLight,
        borderRadius: BorderRadius.circular(16),
        border: user.isCurrentUser
            ? Border.all(color: AppColors.primaryLight, width: 2)
            : null,
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: rankColor.withValues(alpha: 0.2),
              shape: BoxShape.circle,
            ),
            child: Center(
              child: index < 3
                  ? Icon(rankIcon, color: rankColor, size: 24)
                  : Text(
                      '${index + 1}',
                      style: AppTextStyles.body(
                        isDark: false,
                      ).copyWith(color: rankColor, fontWeight: FontWeight.bold),
                    ),
            ),
          ),
          const SizedBox(width: 16),
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
                      style: AppTextStyles.caption(
                        isDark: false,
                      ).copyWith(color: AppColors.textSecondaryLight),
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
                      style: AppTextStyles.caption(
                        isDark: false,
                      ).copyWith(color: AppColors.textSecondaryLight),
                    ),
                  ],
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: AppColors.primaryLight.withValues(alpha: 0.1),
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

  Widget _buildSampleLeaderboardItem(Map<String, dynamic> user, int index) {
    Color rankColor;
    IconData rankIcon;
    if (index == 0) {
      rankColor = const Color(0xFFFFD700);
      rankIcon = Icons.looks_one;
    } else if (index == 1) {
      rankColor = const Color(0xFFC0C0C0);
      rankIcon = Icons.looks_two;
    } else if (index == 2) {
      rankColor = const Color(0xFFCD7F32);
      rankIcon = Icons.looks_3;
    } else {
      rankColor = AppColors.textSecondaryLight;
      rankIcon = Icons.circle;
    }

    final isCurrentUser = user['isMe'] as bool;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isCurrentUser
            ? AppColors.primaryLight.withValues(alpha: 0.1)
            : AppColors.surfaceLight,
        borderRadius: BorderRadius.circular(16),
        border: isCurrentUser
            ? Border.all(color: AppColors.primaryLight, width: 2)
            : null,
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: rankColor.withValues(alpha: 0.2),
              shape: BoxShape.circle,
            ),
            child: Center(
              child: index < 3
                  ? Icon(rankIcon, color: rankColor, size: 24)
                  : Text(
                      '${index + 1}',
                      style: AppTextStyles.body(
                        isDark: false,
                      ).copyWith(color: rankColor, fontWeight: FontWeight.bold),
                    ),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      user['name'] as String,
                      style: AppTextStyles.body(isDark: false).copyWith(
                        fontWeight: FontWeight.bold,
                        color: isCurrentUser
                            ? AppColors.primaryLight
                            : AppColors.textPrimaryLight,
                      ),
                    ),
                    if (isCurrentUser) ...[
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
                      'Seviye ${user['level']}',
                      style: AppTextStyles.caption(
                        isDark: false,
                      ).copyWith(color: AppColors.textSecondaryLight),
                    ),
                    const SizedBox(width: 12),
                    Icon(
                      Icons.star,
                      size: 14,
                      color: AppColors.textSecondaryLight,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '${user['points']} puan',
                      style: AppTextStyles.caption(
                        isDark: false,
                      ).copyWith(color: AppColors.textSecondaryLight),
                    ),
                  ],
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: AppColors.primaryLight.withValues(alpha: 0.1),
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
                  '${user['badges']}',
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
