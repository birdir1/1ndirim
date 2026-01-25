import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';

/// Notification Toggle Tile Widget
class NotificationToggleTile extends StatelessWidget {
  final String title;
  final bool value;
  final bool isLoading;
  final ValueChanged<bool> onChanged;

  const NotificationToggleTile({
    super.key,
    required this.title,
    required this.value,
    required this.isLoading,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          title,
          style: AppTextStyles.caption(isDark: false).copyWith(
            color: AppColors.textPrimaryLight,
          ),
        ),
        Switch(
          value: value,
          onChanged: isLoading ? null : onChanged,
          activeThumbColor: AppColors.secondaryLight,
        ),
      ],
    );
  }
}
