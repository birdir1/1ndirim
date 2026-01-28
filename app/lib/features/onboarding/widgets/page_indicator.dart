import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';

/// Sayfa göstergesi (dot indicators)
class PageIndicator extends StatelessWidget {
  final int currentPage;
  final int pageCount;
  final bool isDark;

  const PageIndicator({
    super.key,
    required this.currentPage,
    required this.pageCount,
    this.isDark = false,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(pageCount, (index) {
        final isActive = index == currentPage;
        return AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          margin: const EdgeInsets.symmetric(horizontal: 3),
          height: 6,
          width: isActive ? 24 : 6,
          decoration: BoxDecoration(
            color: isActive
                ? AppColors.primary(isDark)
                : AppColors.primary(isDark).withValues(alpha: 0.3),
            borderRadius: BorderRadius.circular(3),
          ),
        );
      }),
    );
  }
}
