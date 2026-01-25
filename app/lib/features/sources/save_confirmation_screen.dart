import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';

class SaveConfirmationScreen extends StatelessWidget {
  const SaveConfirmationScreen({super.key});

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
          'Kaynaklarımı Düzenle',
          style: AppTextStyles.pageTitle(isDark: false),
        ),
        actions: [
          TextButton(
            onPressed: null,
            child: Text(
              'Kaydet',
              style: AppTextStyles.button(color: AppColors.textSecondaryLight),
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const SizedBox(height: 80),
            
            // Success Icon
            Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.primaryLight.withOpacity(0.15),
              ),
              child: Center(
                child: Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    color: AppColors.primaryLight, // #8CA9FF
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.check,
                    color: AppColors.cardBackground,
                    size: 48,
                  ),
                ),
              ),
            ),
            
            const SizedBox(height: 32),
            
            // Title
            Text(
              'Kaynaklarınız kaydedildi',
              style: AppTextStyles.headline(isDark: false),
              textAlign: TextAlign.center,
            ),
            
            const SizedBox(height: 16),
            
            // Description
            Text(
              'Seçtiğin kaynaklara göre kampanyalar\notomatik olarak listelenecek.',
              style: AppTextStyles.bodySecondary(isDark: false).copyWith(
                height: 1.5,
              ),
              textAlign: TextAlign.center,
            ),
            
            const SizedBox(height: 48),
            
            // Continue Button
            SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton(
                onPressed: () {
                  Navigator.of(context).popUntil((route) => route.isFirst);
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primaryLight, // #8CA9FF
                  foregroundColor: AppColors.textPrimaryLight, // #1F2937
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: Text(
                  'Devam Et',
                  style: AppTextStyles.button(color: AppColors.textPrimaryLight),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
