import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';

/// Profile Menu Item Widget
class ProfileMenuItem extends StatelessWidget {
  final IconData icon;
  final String title;
  final VoidCallback onTap;

  const ProfileMenuItem({
    super.key,
    required this.icon,
    required this.title,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                Icon(
                  icon,
                  size: 20,
                  color: AppColors.textSecondaryLight,
                ),
                const SizedBox(width: 12),
                Text(
                  title,
                  style: AppTextStyles.caption(isDark: false).copyWith(
                    color: AppColors.textPrimaryLight,
                  ),
                ),
              ],
            ),
            Icon(
              Icons.chevron_right,
              size: 20,
              color: AppColors.textSecondaryLight,
            ),
          ],
        ),
      ),
    );
  }
}
