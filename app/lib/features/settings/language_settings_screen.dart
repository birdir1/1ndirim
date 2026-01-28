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

    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      appBar: AppBar(
        backgroundColor: AppColors.backgroundLight,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.textPrimaryLight),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text(
          l10n.languageSettings,
          style: AppTextStyles.heading(isDark: false),
        ),
        centerTitle: false,
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Text(
            l10n.selectLanguage,
            style: AppTextStyles.body(isDark: false).copyWith(
              color: AppColors.textSecondaryLight,
            ),
          ),
          const SizedBox(height: 20),
          ...LocaleProvider.supportedLocales.map((locale) {
            final isSelected = localeProvider.locale.languageCode == locale.languageCode;
            final languageName = LocaleProvider.languageNames[locale.languageCode] ?? locale.languageCode;

            return Container(
              margin: const EdgeInsets.only(bottom: 12),
              decoration: BoxDecoration(
                color: AppColors.cardBackground,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: isSelected
                      ? AppColors.primaryLight
                      : AppColors.textSecondaryLight.withOpacity(0.1),
                  width: isSelected ? 2 : 1,
                ),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.shadowDark.withOpacity(0.05),
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
                        ? AppColors.primaryLight.withOpacity(0.1)
                        : AppColors.surfaceLight,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Center(
                    child: Text(
                      locale.languageCode.toUpperCase(),
                      style: AppTextStyles.body(isDark: false).copyWith(
                        fontWeight: FontWeight.bold,
                        color: isSelected
                            ? AppColors.primaryLight
                            : AppColors.textSecondaryLight,
                      ),
                    ),
                  ),
                ),
                title: Text(
                  languageName,
                  style: AppTextStyles.body(isDark: false).copyWith(
                    fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                    color: isSelected
                        ? AppColors.primaryLight
                        : AppColors.textPrimaryLight,
                  ),
                ),
                trailing: isSelected
                    ? Icon(
                        Icons.check_circle,
                        color: AppColors.primaryLight,
                      )
                    : null,
                onTap: () async {
                  await localeProvider.setLocale(locale);
                  if (context.mounted) {
                    Navigator.of(context).pop();
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('${l10n.language} ${l10n.save.toLowerCase()}'),
                        backgroundColor: AppColors.success,
                        duration: const Duration(seconds: 2),
                      ),
                    );
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
