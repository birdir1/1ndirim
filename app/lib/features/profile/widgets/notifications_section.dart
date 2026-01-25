import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import 'profile_section_title.dart';
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
            icon: Icons.notifications,
            title: 'Bildirimler',
            subtitle: 'Yeni ve bitmek üzere olan fırsatlar',
          ),
          const SizedBox(height: 24),
          Padding(
            padding: const EdgeInsets.only(left: 4),
            child: Column(
              children: [
                NotificationToggleTile(
                  title: 'Yeni fırsatlar',
                  value: newOpportunitiesEnabled,
                  isLoading: isLoading,
                  onChanged: onNewOpportunitiesChanged,
                ),
                const SizedBox(height: 20),
                Divider(
                  color: AppColors.divider,
                  height: 1,
                ),
                const SizedBox(height: 20),
                NotificationToggleTile(
                  title: 'Süresi dolmak üzere olanlar',
                  value: expiringOpportunitiesEnabled,
                  isLoading: isLoading,
                  onChanged: onExpiringChanged,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
