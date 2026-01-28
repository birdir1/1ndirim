import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/page_transitions.dart';
import '../search/search_screen.dart';

/// Arama çubuğu widget'ı
/// Ana sayfada kullanılır, tıklandığında arama ekranına yönlendirir
class SearchBarWidget extends StatelessWidget {
  const SearchBarWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () {
        Navigator.of(context).push(
          SlidePageRoute(
            child: const SearchScreen(),
            direction: SlideDirection.bottom,
          ),
        );
      },
      borderRadius: BorderRadius.circular(16),
      child: Container(
        height: 48,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        decoration: BoxDecoration(
          color: AppColors.cardBackground,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: AppColors.textPrimaryLight.withOpacity(0.1),
            width: 1,
          ),
          boxShadow: [
            BoxShadow(
              color: AppColors.shadowDark.withOpacity(0.05),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            Icon(
              Icons.search,
              color: AppColors.textSecondaryLight,
              size: 20,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                'Kampanya ara...',
                style: TextStyle(
                  color: AppColors.textSecondaryLight,
                  fontSize: 15,
                  fontWeight: FontWeight.w400,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
