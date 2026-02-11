import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';

/// Filter Chip Item Widget
class FilterChipItem extends StatelessWidget {
  final String name;
  final Color? color;
  final bool isActive;
  final VoidCallback onTap;

  const FilterChipItem({
    super.key,
    required this.name,
    this.color,
    required this.isActive,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 10),
      child: InkWell(
        onTap: onTap,
        child: Container(
          constraints: const BoxConstraints(minWidth: 60, maxWidth: 140),
          height: 44,
          padding: EdgeInsets.symmetric(
            horizontal: color != null ? 10 : 16,
            vertical: 6,
          ),
          decoration: BoxDecoration(
            color: isActive
                ? AppColors
                      .secondaryLight // #8CA9FF
                : AppColors.cardBackground,
            borderRadius: BorderRadius.circular(18),
            boxShadow: [
              BoxShadow(
                color: AppColors.shadowMedium,
                blurRadius: 4,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (color != null) ...[
                Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: color,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 6),
              ],
              Flexible(
                child: Text(
                  name,
                  style: AppTextStyles.cardSubtitle(isDark: false).copyWith(
                    fontSize: 12,
                    fontWeight: isActive ? FontWeight.w600 : FontWeight.w500,
                    color: isActive
                        ? AppColors.cardBackground
                        : AppColors.textPrimaryLight,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
