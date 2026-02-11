import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/theme/app_ui_tokens.dart';
import '../../core/l10n/app_localizations.dart';
import '../../core/widgets/screen_shell.dart';
import '../../core/widgets/section_card.dart';

class HowItWorksScreen extends StatelessWidget {
  const HowItWorksScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return ScreenShell(
      title: l10n.howItWorksTitle,
      centerTitle: true,
      actions: [
        IconButton(
          icon: const Icon(
            Icons.share_outlined,
            color: AppColors.textPrimaryLight,
            size: 24,
          ),
          tooltip: l10n.share,
          onPressed: () {
            // TODO: Implement share functionality
          },
        ),
      ],
      child: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(vertical: AppUiTokens.sectionGap),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              l10n.howItWorksTitle,
              style: AppTextStyles.headline(isDark: false),
            ),
            const SizedBox(height: AppUiTokens.sectionGap),

            _buildStep(
              stepNumber: 1,
              title: l10n.howItWorksStep1Title,
              description: l10n.howItWorksStep1Desc,
              icon: Icons.check_circle_outline,
            ),
            const SizedBox(height: AppUiTokens.sectionGap),

            _buildStep(
              stepNumber: 2,
              title: l10n.howItWorksStep2Title,
              description: l10n.howItWorksStep2Desc,
              icon: Icons.list_alt,
            ),
            const SizedBox(height: AppUiTokens.sectionGap),

            _buildStep(
              stepNumber: 3,
              title: l10n.howItWorksStep3Title,
              description: l10n.howItWorksStep3Desc,
              icon: Icons.shopping_bag_outlined,
            ),
            const SizedBox(height: AppUiTokens.sectionGap),
          ],
        ),
      ),
    );
  }

  Widget _buildStep({
    required int stepNumber,
    required String title,
    required String description,
    required IconData icon,
  }) {
    return SectionCard(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: AppColors.primaryLight, // #8CA9FF
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                '$stepNumber',
                style: AppTextStyles.pageTitle(isDark: false),
              ),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: AppTextStyles.sectionTitle(isDark: false)),
                const SizedBox(height: 8),
                Text(
                  description,
                  style: AppTextStyles.bodySecondary(isDark: false).copyWith(
                    fontSize: 14,
                    color: AppColors.textSecondaryLight, // #6B7280
                    height: 1.5,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: AppColors.primaryLight.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: AppColors.primaryLight, size: 24),
          ),
        ],
      ),
    );
  }
}
