import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/widgets/app_logo.dart';
import '../widgets/primary_button.dart';

/// Onboarding 3 - Aggregation
/// "Biz senin için toplarız."
class AggregationPage extends StatelessWidget {
  final VoidCallback onNext;
  final VoidCallback onSkip;
  final bool isDark;

  const AggregationPage({
    super.key,
    required this.onNext,
    required this.onSkip,
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

            // Card Stack Illustration
            _buildCardStack(),

            const Spacer(),

            // Text Content
            _buildContent(),

            const SizedBox(height: 32),

            // Button
            PrimaryButton(
              label: 'Devam →',
              onPressed: onNext,
              isDark: isDark,
            ),

            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildCardStack() {
    return SizedBox(
      width: 256,
      height: 192,
      child: Stack(
        children: [
          // Card 3 - Back (#AAC4F5, -rotate-6, left-8 top-4)
          Positioned(
            left: 32,
            top: 16,
            child: Transform.rotate(
              angle: -0.1047, // -6 degrees in radians
              child: Container(
                width: 192,
                height: 128,
                decoration: BoxDecoration(
                  color: AppColors.secondaryLight, // #AAC4F5
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
            ),
          ),

          // Card 2 - Middle (#8CA9FF, rotate-3, left-4 top-2)
          Positioned(
            left: 16,
            top: 8,
            child: Transform.rotate(
              angle: 0.0524, // 3 degrees in radians
              child: Container(
                width: 192,
                height: 128,
                decoration: BoxDecoration(
                  color: AppColors.primaryLight, // #8CA9FF
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
            ),
          ),

          // Card 1 - Front (#FFF8DE, shadow-lg)
          Positioned(
            left: 0,
            top: 0,
            child: Container(
              width: 192,
              height: 128,
              decoration: BoxDecoration(
                color: AppColors.surfaceLight, // #FFF8DE
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.shadowLight,
                    blurRadius: 20,
                    offset: const Offset(0, 10),
                  ),
                ],
              ),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Container(
                          width: 32,
                          height: 32,
                          decoration: BoxDecoration(
                            color: AppColors.primaryLight,
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                        Text(
                          'Kampanya',
                          style: AppTextStyles.small(isDark: isDark).copyWith(
                            fontSize: 10,
                            fontWeight: FontWeight.w600,
                            color: AppColors.textSecondaryLight,
                          ),
                        ),
                      ],
                    ),
                    const Spacer(),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: 96,
                          height: 8,
                          decoration: BoxDecoration(
                            color: AppColors.backgroundLight,
                            borderRadius: BorderRadius.circular(4),
                          ),
                        ),
                        const SizedBox(height: 4),
                        Container(
                          width: 64,
                          height: 8,
                          decoration: BoxDecoration(
                            color: AppColors.backgroundLight,
                            borderRadius: BorderRadius.circular(4),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
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
          'Biz senin için toplarız.',
          style: AppTextStyles.headline(isDark: isDark),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 16),
        Text(
          'Seçtiklerine göre geçerli olan\nkampanyaları otomatik olarak listeleriz.',
          style: AppTextStyles.bodySecondary(isDark: isDark),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 12),
        Text(
          'Aramana gerek yok.',
          style: AppTextStyles.body(isDark: isDark).copyWith(
            fontWeight: FontWeight.w600,
          ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }
}
