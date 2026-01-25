import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/widgets/app_logo.dart';
import '../widgets/page_indicator.dart';
import '../widgets/primary_button.dart';

/// Onboarding 4 - Trust
/// "Biz sadece gösteririz."
class TrustPage extends StatelessWidget {
  final VoidCallback onComplete;
  final bool isDark;

  const TrustPage({
    super.key,
    required this.onComplete,
    this.isDark = false,
  });

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Container(
        color: AppColors.backgroundLight, // #FFF2C6
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 48),
        child: Column(
          children: [
            // Logo
            Padding(
              padding: const EdgeInsets.only(top: 32),
              child: AppLogo(
                fontSize: 32,
                textColor: AppColors.textPrimaryLight,
              ),
            ),

            const Spacer(),

            // Shield + Eye Icon Combination
            _buildTrustIcon(),

            const Spacer(),

            // Text Content
            _buildContent(),

            const Spacer(),

            // Page Indicator
            const PageIndicator(currentPage: 3, pageCount: 4),

            const SizedBox(height: 24),

            // Button
            PrimaryButton(
              label: 'Başlayalım',
              onPressed: onComplete,
              isDark: isDark,
              showArrow: false,
            ),

            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildTrustIcon() {
    return SizedBox(
      width: 160,
      height: 160,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Background circle (w-32 h-32, #FFF8DE)
          Container(
            width: 128,
            height: 128,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppColors.surfaceLight, // #FFF8DE
            ),
          ),

          // Shield Icon (w-20 h-20, #8CA9FF background, #1F2937 icon color)
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: AppColors.primaryLight, // #8CA9FF
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(
              Icons.shield,
              color: AppColors.textPrimaryLight, // #1F2937
              size: 40,
            ),
          ),

          // Eye Icon (w-14 h-14, #AAC4F5 background, -bottom-2 -right-2)
          Positioned(
            bottom: -8,
            right: -8,
            child: Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: AppColors.secondaryLight, // #AAC4F5
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                Icons.remove_red_eye,
                color: AppColors.textPrimaryLight, // #1F2937
                size: 28,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildContent() {
    return Column(
      children: [
        Text(
          'Biz sadece gösteririz.',
          style: AppTextStyles.headline(isDark: isDark),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 16),
        Text(
          'Bir hakkı kullanıp kullanmadığını bilmeyiz.\nSadece şu an geçerli olanları listeleriz.',
          style: AppTextStyles.bodySecondary(isDark: isDark),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }
}
