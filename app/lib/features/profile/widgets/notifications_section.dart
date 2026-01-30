import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import 'notification_toggle_tile.dart';

/// Notifications Section Widget
class NotificationsSection extends StatelessWidget {
  final bool newOpportunitiesEnabled;
  final bool expiringOpportunitiesEnabled;
  final bool isLoading;
  final ValueChanged<bool> onNewOpportunitiesChanged;
  final ValueChanged<bool> onExpiringChanged;

  const NotificationsSection({
    super.key,
    required this.newOpportunitiesEnabled,
    required this.expiringOpportunitiesEnabled,
    required this.isLoading,
    required this.onNewOpportunitiesChanged,
    required this.onExpiringChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      margin: const EdgeInsets.symmetric(horizontal: 5),
      decoration: BoxDecoration(
        color: AppColors.cardBackground,
        borderRadius: BorderRadius.circular(16),
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
          Row(
            children: [
              Icon(
                Icons.notifications,
                size: 20,
                color: AppColors.primaryLight,
              ),
              const SizedBox(width: 8),
              Text(
                'Bildirimler',
                style: AppTextStyles.sectionTitle(
                  isDark: false,
                ).copyWith(fontSize: 16),
              ),
            ],
          ),
          const SizedBox(height: 16),
          NotificationToggleTile(
            title: 'Yeni fırsatlar',
            value: newOpportunitiesEnabled,
            isLoading: isLoading,
            onChanged: onNewOpportunitiesChanged,
          ),
          const SizedBox(height: 12),
          NotificationToggleTile(
            title: 'Süresi dolmak üzere olanlar',
            value: expiringOpportunitiesEnabled,
            isLoading: isLoading,
            onChanged: onExpiringChanged,
          ),
        ],
      ),
    );
  }
}
