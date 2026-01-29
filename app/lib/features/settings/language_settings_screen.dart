import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/providers/locale_provider.dart';
import '../../core/l10n/app_localizations.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';

/// Dil Ayarları Ekranı
class LanguageSettingsScreen extends StatelessWidget {
  const LanguageSettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final localeProvider = Provider.of<LocaleProvider>(context);
    final l10n = AppLocalizations.of(context)!;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final backgroundColor = isDark
        ? AppColors.backgroundDark
        : AppColors.backgroundLight;
    final textColor = isDark
        ? AppColors.textPrimaryDark
        : AppColors.textPrimaryLight;

    return Scaffold(
      backgroundColor: backgroundColor,
      appBar: AppBar(
        backgroundColor: backgroundColor,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: textColor),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text(
          l10n.languageSettings,
          style: AppTextStyles.headline(isDark: isDark),
        ),
        centerTitle: false,
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Text(
            l10n.selectLanguage,
            style: AppTextStyles.body(isDark: isDark).copyWith(
              color: isDark
                  ? AppColors.textSecondaryDark
                  : AppColors.textSecondaryLight,
            ),
          ),
          const SizedBox(height: 20),
          ...LocaleProvider.supportedLocales.map((locale) {
            final isSelected =
                localeProvider.locale.languageCode == locale.languageCode;
            final languageName =
                LocaleProvider.languageNames[locale.languageCode] ??
                locale.languageCode;
            final primaryColor = isDark
                ? AppColors.primaryDark
                : AppColors.primaryLight;
            final cardColor = isDark
                ? AppColors.surfaceDark
                : AppColors.cardBackground;
            final surfaceColor = isDark
                ? AppColors.backgroundDark
                : AppColors.surfaceLight;

            return Container(
              margin: const EdgeInsets.only(bottom: 12),
              decoration: BoxDecoration(
                color: cardColor,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: isSelected
                      ? primaryColor
                      : (isDark
                                ? AppColors.textSecondaryDark
                                : AppColors.textSecondaryLight)
                            .withValues(alpha: 0.1),
                  width: isSelected ? 2 : 1,
                ),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.shadowDark.withValues(alpha: 0.05),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: ListTile(
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: 12,
                ),
                leading: Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: isSelected
                        ? primaryColor.withValues(alpha: 0.1)
                        : surfaceColor,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Center(
                    child: Text(
                      locale.languageCode.toUpperCase(),
                      style: AppTextStyles.body(isDark: isDark).copyWith(
                        fontWeight: FontWeight.bold,
                        color: isSelected
                            ? primaryColor
                            : (isDark
                                  ? AppColors.textSecondaryDark
                                  : AppColors.textSecondaryLight),
                      ),
                    ),
                  ),
                ),
                title: Text(
                  languageName,
                  style: AppTextStyles.body(isDark: isDark).copyWith(
                    fontWeight: isSelected
                        ? FontWeight.bold
                        : FontWeight.normal,
                    color: isSelected ? primaryColor : textColor,
                  ),
                ),
                trailing: isSelected
                    ? Icon(Icons.check_circle, color: primaryColor)
                    : null,
                onTap: () async {
                  await localeProvider.setLocale(locale);
                  if (context.mounted) {
                    // Profil ekranına geri dön ve uygulamanın yeniden yüklenmesini bekle
                    Navigator.of(context).pop();

                    // Kısa bir gecikme ile mesaj göster
                    await Future.delayed(const Duration(milliseconds: 100));

                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text('Dil değiştirildi: $languageName'),
                          backgroundColor: AppColors.success,
                          duration: const Duration(seconds: 2),
                        ),
                      );
                    }
                  }
                },
              ),
            );
          }),
        ],
      ),
    );
  }
}
