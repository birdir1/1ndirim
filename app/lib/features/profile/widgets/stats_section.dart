import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../data/models/user_stats_model.dart';
import '../../../core/utils/network_result.dart';
import 'profile_section_title.dart';

/// Stats Section Widget
class StatsSection extends StatelessWidget {
  final NetworkResult<UserStatsModel>? statsResult;
  final bool isLoading;

  const StatsSection({
    super.key,
    required this.statsResult,
    required this.isLoading,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      margin: const EdgeInsets.symmetric(horizontal: 5),
      decoration: BoxDecoration(
        color: AppColors.cardBackground,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: AppColors.shadowMedium,
            blurRadius: 4,
            offset: const Offset(0, 0),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ProfileSectionTitle(
            icon: Icons.bar_chart,
            title: 'İstatistikler',
            subtitle: 'Aktivitelerinizin özeti',
          ),
          const SizedBox(height: 24),

          if (isLoading)
            const Center(
              child: Padding(
                padding: EdgeInsets.all(16.0),
                child: CircularProgressIndicator(),
              ),
            )
          else if (statsResult is NetworkError)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.error.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: AppColors.error.withValues(alpha: 0.3),
                ),
              ),
              child: Row(
                children: [
                  Icon(Icons.info_outline, color: AppColors.error, size: 20),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'İstatistikler şu anda yüklenemiyor. Lütfen daha sonra tekrar deneyin.',
                      style: AppTextStyles.body(
                        isDark: false,
                      ).copyWith(color: AppColors.error),
                    ),
                  ),
                ],
              ),
            )
          else if (statsResult is NetworkSuccess)
            _buildStatsGrid((statsResult as NetworkSuccess).data)
          else
            _buildStatsGrid(null),
        ],
      ),
    );
  }

  Widget _buildStatsGrid(UserStatsModel? stats) {
    final favoriteCount = stats?.favoriteCount ?? 0;
    final commentCount = stats?.commentCount ?? 0;
    final ratingCount = stats?.ratingCount ?? 0;
    final totalActivity = stats?.totalActivity ?? 0;

    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _buildStatItem(
                icon: Icons.favorite,
                iconColor: AppColors.error,
                label: 'Favoriler',
                value: favoriteCount.toString(),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildStatItem(
                icon: Icons.comment,
                iconColor: AppColors.primaryLight,
                label: 'Yorumlar',
                value: commentCount.toString(),
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
                iconColor: AppColors.warning,
                label: 'Puanlar',
                value: ratingCount.toString(),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildStatItem(
                icon: Icons.trending_up,
                iconColor: AppColors.success,
                label: 'Toplam',
                value: totalActivity.toString(),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildStatItem({
    required IconData icon,
    required Color iconColor,
    required String label,
    required String value,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: iconColor.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          Icon(icon, color: iconColor, size: 24),
          const SizedBox(height: 8),
          Text(
            value,
            style: AppTextStyles.headline(isDark: false).copyWith(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: iconColor,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: AppTextStyles.caption(isDark: false).copyWith(fontSize: 12),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}
