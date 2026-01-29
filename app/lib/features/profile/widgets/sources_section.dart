import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/page_transitions.dart';
import '../../sources/edit_sources_screen.dart';
import 'profile_section_title.dart';

/// Sources Section Widget
class SourcesSection extends StatelessWidget {
  const SourcesSection({super.key});

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
            icon: Icons.credit_card,
            title: 'Kullandıklarım',
            subtitle:
                'Fırsatları hangi banka ve operatörlere göre gördüğünüzü buradan yönetirsin',
          ),
          const SizedBox(height: 16),
          InkWell(
            onTap: () {
              Navigator.of(context).push(
                SlidePageRoute(
                  child: const EditSourcesScreen(),
                  direction: SlideDirection.right,
                ),
              );
            },
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.badgeBackgroundSecondary,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.transparent),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Kaynakları düzenle',
                    style: AppTextStyles.caption(isDark: false).copyWith(
                      fontWeight: FontWeight.w600,
                      color: AppColors.secondaryLight,
                    ),
                  ),
                  Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      color: AppColors.cardBackground,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.shadowMedium,
                          blurRadius: 4,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: const Icon(
                      Icons.arrow_forward,
                      size: 18,
                      color: AppColors.secondaryLight,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
