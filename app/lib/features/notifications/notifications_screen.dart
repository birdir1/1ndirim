import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/widgets/empty_state.dart';

class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      body: SafeArea(
        child: Column(
          children: [
            // Header
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const SizedBox(width: 48),
                  Expanded(
                    child: Center(
                      child: Text(
                        'Bildirimler',
                        style: AppTextStyles.title(isDark: false).copyWith(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimaryLight,
                          letterSpacing: -0.015,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 48),
                ],
              ),
            ),

            // Empty State
            const Expanded(
              child: AppEmptyState(
                icon: Icons.notifications_outlined,
                title: 'Henüz bildirim yok',
                description:
                    'Yeni fırsatlar eklendiğinde sadece gerçekten işine yarayanları haber vereceğiz.',
              ),
            ),
          ],
        ),
      ),
    );
  }
}
