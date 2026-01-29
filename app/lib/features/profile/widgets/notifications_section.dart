import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/services/notification_service.dart';
import 'profile_section_title.dart';
import 'notification_toggle_tile.dart';

/// Notifications Section Widget
class NotificationsSection extends StatefulWidget {
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
  State<NotificationsSection> createState() => _NotificationsSectionState();
}

class _NotificationsSectionState extends State<NotificationsSection> {
  String? _fcmTokenStatus;

  @override
  void initState() {
    super.initState();
    _checkFcmToken();
  }

  void _checkFcmToken() {
    final token = NotificationService().fcmToken;
    setState(() {
      _fcmTokenStatus = token != null ? 'Aktif' : 'Henüz kaydedilmedi';
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardColor = isDark ? AppColors.surfaceDark : AppColors.cardBackground;
    final secondaryTextColor = isDark
        ? AppColors.textSecondaryDark
        : AppColors.textSecondaryLight;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      margin: const EdgeInsets.symmetric(horizontal: 5),
      decoration: BoxDecoration(
        color: cardColor,
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
                  value: widget.newOpportunitiesEnabled,
                  isLoading: widget.isLoading,
                  onChanged: widget.onNewOpportunitiesChanged,
                ),
                const SizedBox(height: 20),
                Divider(color: AppColors.divider, height: 1),
                const SizedBox(height: 20),
                NotificationToggleTile(
                  title: 'Süresi dolmak üzere olanlar',
                  value: widget.expiringOpportunitiesEnabled,
                  isLoading: widget.isLoading,
                  onChanged: widget.onExpiringChanged,
                ),
                const SizedBox(height: 20),
                Divider(color: AppColors.divider, height: 1),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Icon(
                          _fcmTokenStatus == 'Aktif'
                              ? Icons.check_circle
                              : Icons.info_outline,
                          size: 16,
                          color: _fcmTokenStatus == 'Aktif'
                              ? AppColors.success
                              : secondaryTextColor,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'Bildirim durumu',
                          style: AppTextStyles.caption(
                            isDark: isDark,
                          ).copyWith(color: secondaryTextColor),
                        ),
                      ],
                    ),
                    Text(
                      _fcmTokenStatus ?? 'Kontrol ediliyor...',
                      style: AppTextStyles.caption(isDark: isDark).copyWith(
                        color: _fcmTokenStatus == 'Aktif'
                            ? AppColors.success
                            : secondaryTextColor,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
