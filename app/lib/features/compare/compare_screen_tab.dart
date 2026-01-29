import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/providers/compare_provider.dart';
import 'compare_screen.dart';

/// Compare Screen Tab - Wrapper for bottom navigation
/// Shows empty state when no campaigns selected
class CompareScreenTab extends StatelessWidget {
  const CompareScreenTab({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<CompareProvider>(
      builder: (context, compareProvider, child) {
        if (compareProvider.campaigns.isEmpty) {
          return Scaffold(
            backgroundColor: AppColors.backgroundLight,
            body: SafeArea(
              child: Column(
                children: [
                  // Header
                  Container(
                    padding: const EdgeInsets.fromLTRB(24, 16, 24, 12),
                    child: Text(
                      'Karşılaştır',
                      style: AppTextStyles.headline(
                        isDark: false,
                      ).copyWith(fontSize: 24),
                    ),
                  ),
                  // Empty State
                  Expanded(
                    child: Center(
                      child: Padding(
                        padding: const EdgeInsets.all(32),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Container(
                              width: 120,
                              height: 120,
                              decoration: BoxDecoration(
                                color: AppColors.primaryLight.withValues(
                                  alpha: 0.1,
                                ),
                                shape: BoxShape.circle,
                              ),
                              child: Icon(
                                Icons.compare_arrows,
                                size: 60,
                                color: AppColors.primaryLight.withValues(
                                  alpha: 0.5,
                                ),
                              ),
                            ),
                            const SizedBox(height: 24),
                            Text(
                              'Kampanya Seç',
                              style: AppTextStyles.title(isDark: false),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 12),
                            Text(
                              'Karşılaştırmak için kampanyaların üzerindeki karşılaştır butonuna bas',
                              style: AppTextStyles.body(
                                isDark: false,
                              ).copyWith(color: AppColors.textSecondaryLight),
                              textAlign: TextAlign.center,
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          );
        }

        // Show compare screen with selected campaigns
        return CompareScreen(campaigns: compareProvider.campaigns);
      },
    );
  }
}
