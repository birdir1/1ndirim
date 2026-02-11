import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/widgets/section_card.dart';
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
    return SectionCard(
      padding: const EdgeInsets.all(16),
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
