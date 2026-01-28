import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';

class HowItWorksScreen extends StatelessWidget {
  const HowItWorksScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundLight, // #FFF2C6
      appBar: AppBar(
        backgroundColor: AppColors.backgroundLight,
        elevation: 0,
        leading: IconButton(
          icon: Icon(
            Icons.arrow_back_ios_new,
            color: AppColors.textPrimaryLight, // #1F2937
            size: 20,
          ),
          onPressed: () => Navigator.of(context).pop(),
        ),
        centerTitle: true,
        title: Text(
          'Nasıl Çalışır?',
          style: AppTextStyles.pageTitle(isDark: false),
        ),
        actions: [
          IconButton(
            icon: Icon(
              Icons.share_outlined,
              color: AppColors.textPrimaryLight,
              size: 24,
            ),
            onPressed: () {
              // TODO: Implement share functionality
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Text(
              'Nasıl Çalışır?',
              style: AppTextStyles.headline(isDark: false),
            ),
            const SizedBox(height: 32),

            // Step 1
            _buildStep(
              stepNumber: 1,
              title: 'Kaynaklarını Seç',
              description:
                  'Hangi banka ve operatörlere sahipsen sadece onları seçmen yeterli. Kart bilgisi veya şifre istemiyoruz.',
              icon: Icons.check_circle_outline,
            ),
            const SizedBox(height: 32),

            // Step 2
            _buildStep(
              stepNumber: 2,
              title: 'Kampanyaları Gör',
              description:
                  'Seçtiklerine göre geçerli olan kampanyaları otomatik olarak listeleriz. Aramana gerek yok.',
              icon: Icons.list_alt,
            ),
            const SizedBox(height: 32),

            // Step 3
            _buildStep(
              stepNumber: 3,
              title: 'Fırsatları Kullan',
              description:
                  'Kampanyaları görüntüle ve kartınla alışveriş yaparak fırsatlardan yararlan.',
              icon: Icons.shopping_bag_outlined,
            ),
            const SizedBox(height: 32),
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
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surfaceLight, // #FFF8DE
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: AppColors.shadowMedium,
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Step Number Circle
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
          // Content
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: AppTextStyles.sectionTitle(isDark: false),
                ),
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
          // Icon
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: AppColors.primaryLight.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              icon,
              color: AppColors.primaryLight,
              size: 24,
            ),
          ),
        ],
      ),
    );
  }
}
