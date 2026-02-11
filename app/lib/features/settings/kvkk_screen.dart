import 'package:flutter/material.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/l10n/app_localizations.dart';
import '../../core/widgets/screen_shell.dart';
import '../../core/widgets/section_card.dart';

/// KVKK Screen
class KVKKScreen extends StatelessWidget {
  const KVKKScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return ScreenShell(
      title: l10n.kvkkPageTitle,
      child: SingleChildScrollView(
        padding: const EdgeInsets.only(bottom: 24, top: 8),
        child: SectionCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                l10n.kvkkFullTitle,
                style: AppTextStyles.subtitle(isDark: false),
              ),
              const SizedBox(height: 12),
              Text(
                l10n.kvkkPlaceholder,
                style: AppTextStyles.body(isDark: false),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
