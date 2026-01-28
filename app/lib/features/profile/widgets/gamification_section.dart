import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/network_result.dart';
import '../../../data/models/user_points_model.dart';
import '../../../data/models/user_badge_model.dart';
import '../../../data/repositories/gamification_repository.dart';
import 'profile_section_title.dart';

/// Gamification Bölümü - Puan ve Rozetler
class GamificationSection extends StatefulWidget {
  const GamificationSection({super.key});

  @override
  State<GamificationSection> createState() => _GamificationSectionState();
}

class _GamificationSectionState extends State<GamificationSection> {
  final GamificationRepository _repository = GamificationRepository();
  NetworkResult<UserPointsModel>? _pointsResult;
  NetworkResult<List<UserBadgeModel>>? _badgesResult;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadGamification();
  }

  Future<void> _loadGamification() async {
    if (_isLoading) return;

    setState(() {
      _isLoading = true;
    });

    final pointsResult = await _repository.getUserPoints();
    final badgesResult = await _repository.getUserBadges();

    if (mounted) {
      setState(() {
        _pointsResult = pointsResult;
        _badgesResult = badgesResult;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const ProfileSectionTitle(
          icon: Icons.emoji_events,
          title: 'Puanlar ve Rozetler',
        ),
        const SizedBox(height: 16),
        if (_isLoading)
          const Center(
            child: Padding(
              padding: EdgeInsets.all(24.0),
              child: CircularProgressIndicator(
                color: AppColors.primaryLight,
              ),
            ),
          )
        else ...[
          // Puan Kartı
          _buildPointsCard(),
          const SizedBox(height: 16),
          // Rozetler
          _buildBadgesSection(),
        ],
      ],
    );
  }

  Widget _buildPointsCard() {
    if (_pointsResult is NetworkError) {
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
                (_pointsResult as NetworkError).message,
                style: AppTextStyles.caption(isDark: false).copyWith(
                  color: AppColors.error,
                ),
              ),
            ),
          ],
        ),
      );
    }

    if (_pointsResult is! NetworkSuccess<UserPointsModel>) {
      return const SizedBox.shrink();
    }

    final points = (_pointsResult as NetworkSuccess<UserPointsModel>).data;

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
                  Icons.emoji_events,
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
                      'Seviye ${points.level}',
                      style: AppTextStyles.heading(isDark: false).copyWith(
                        color: Colors.white,
                        fontSize: 24,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${points.totalPointsEarned} toplam puan',
                      style: AppTextStyles.body(isDark: false).copyWith(
                        color: Colors.white.withOpacity(0.9),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          // Seviye İlerleme Çubuğu
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Bir sonraki seviyeye',
                    style: AppTextStyles.caption(isDark: false).copyWith(
                      color: Colors.white.withOpacity(0.9),
                    ),
                  ),
                  Text(
                    '${points.pointsToNextLevel} puan kaldı',
                    style: AppTextStyles.caption(isDark: false).copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: LinearProgressIndicator(
                  value: points.levelProgress,
                  minHeight: 8,
                  backgroundColor: Colors.white.withOpacity(0.3),
                  valueColor: const AlwaysStoppedAnimation<Color>(Colors.white),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildBadgesSection() {
    if (_badgesResult is NetworkError) {
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
                (_badgesResult as NetworkError).message,
                style: AppTextStyles.caption(isDark: false).copyWith(
                  color: AppColors.error,
                ),
              ),
            ),
          ],
        ),
      );
    }

    if (_badgesResult is! NetworkSuccess<List<UserBadgeModel>>) {
      return const SizedBox.shrink();
    }

    final badges = (_badgesResult as NetworkSuccess<List<UserBadgeModel>>).data;

    if (badges.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: AppColors.surfaceLight,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          children: [
            Icon(
              Icons.emoji_events_outlined,
              size: 48,
              color: AppColors.textSecondaryLight,
            ),
            const SizedBox(height: 12),
            Text(
              'Henüz rozet kazanmadın',
              style: AppTextStyles.body(isDark: false).copyWith(
                color: AppColors.textSecondaryLight,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'Aktiviteler yaparak rozet kazanabilirsin',
              style: AppTextStyles.caption(isDark: false).copyWith(
                color: AppColors.textSecondaryLight,
              ),
            ),
          ],
        ),
      );
    }

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 0.85,
      ),
      itemCount: badges.length,
      itemBuilder: (context, index) {
        final badge = badges[index];
        return _buildBadgeItem(badge);
      },
    );
  }

  Widget _buildBadgeItem(UserBadgeModel badge) {
    // Rarity'ye göre renk
    Color rarityColor;
    switch (badge.rarity) {
      case 'legendary':
        rarityColor = const Color(0xFFFF5722);
        break;
      case 'epic':
        rarityColor = const Color(0xFF9C27B0);
        break;
      case 'rare':
        rarityColor = const Color(0xFF2196F3);
        break;
      default:
        rarityColor = const Color(0xFF9E9E9E);
    }

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.surfaceLight,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: rarityColor.withOpacity(0.3),
          width: 2,
        ),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: rarityColor.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(
              _getIconData(badge.iconName),
              color: rarityColor,
              size: 32,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            badge.name,
            style: AppTextStyles.caption(isDark: false).copyWith(
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimaryLight,
            ),
            textAlign: TextAlign.center,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  IconData _getIconData(String iconName) {
    switch (iconName) {
      case 'favorite':
        return Icons.favorite;
      case 'favorite_border':
        return Icons.favorite_border;
      case 'comment':
        return Icons.comment;
      case 'star':
        return Icons.star;
      case 'emoji_events':
        return Icons.emoji_events;
      default:
        return Icons.emoji_events;
    }
  }
}
