import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';

/// Profile Section Title Widget
class ProfileSectionTitle extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;

  const ProfileSectionTitle({
    super.key,
    required this.icon,
    required this.title,
    this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppColors.secondaryLight.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                icon,
                size: 20,
                color: AppColors.secondaryLight,
              ),
            ),
            const SizedBox(width: 8),
            Text(
              title,
              style: AppTextStyles.sectionTitle(isDark: false),
            ),
          ],
        ),
        if (subtitle != null) ...[
          const SizedBox(height: 8),
          Padding(
            padding: const EdgeInsets.only(left: 4),
            child: Text(
              subtitle!,
              style: AppTextStyles.bodySecondary(isDark: false).copyWith(
                fontSize: 14,
                color: AppColors.badgeTextSecondary,
              ),
            ),
          ),
        ],
      ],
    );
  }
}
