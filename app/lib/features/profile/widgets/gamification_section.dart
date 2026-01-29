import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import 'profile_section_title.dart';

/// Gamification Bölümü - Puan ve Rozetler
class GamificationSection extends StatelessWidget {
  const GamificationSection({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const ProfileSectionTitle(
          icon: Icons.emoji_events,
          title: 'Puanlar ve Rozetler',
        ),
        const SizedBox(height: 16),

        // Bilgi mesajı
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.warning.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.warning.withValues(alpha: 0.3)),
          ),
          child: Row(
            children: [
              Icon(Icons.info_outline, color: AppColors.warning, size: 20),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  'Puan ve rozet sistemi yakında aktif olacak. Aktivitelerinizi yaparak puan kazanabileceksiniz.',
                  style: AppTextStyles.caption(
                    isDark: false,
                  ).copyWith(color: AppColors.warning),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
