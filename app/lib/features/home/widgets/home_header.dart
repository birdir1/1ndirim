import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_ui_tokens.dart';
import '../../../core/l10n/app_localizations.dart';
import 'package:provider/provider.dart';
import '../../../core/widgets/app_logo.dart';
import '../../../core/providers/compare_provider.dart';
import '../../compare/compare_screen.dart';
import '../../../core/utils/page_transitions.dart';
import 'search_bar_widget.dart';

/// Home Header Widget
class HomeHeader extends StatelessWidget {
  const HomeHeader({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(
        AppUiTokens.screenPadding,
        AppUiTokens.sectionGap,
        AppUiTokens.screenPadding,
        8,
      ),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: AppUiTokens.elevatedSurface(
          color: AppColors.surfaceLight.withValues(alpha: 0.94),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            AppLogo(fontSize: 26, textColor: AppColors.textPrimaryLight),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(child: const SearchBarWidget()),
                const SizedBox(width: 12),
                // Karşılaştırma Butonu
                Consumer<CompareProvider>(
                  builder: (context, compareProvider, child) {
                    return Stack(
                      children: [
                        InkWell(
                          onTap: () {
                            if (compareProvider.isEmpty) {
                              final l10n = AppLocalizations.of(context);
                              if (l10n != null) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text(l10n.selectCampaigns),
                                    duration: const Duration(seconds: 2),
                                  ),
                                );
                              }
                            } else {
                              Navigator.of(context).push(
                                SlidePageRoute(
                                  child: CompareScreen(
                                    campaigns: compareProvider.campaigns,
                                  ),
                                  direction: SlideDirection.up,
                                ),
                              );
                            }
                          },
                          borderRadius: BorderRadius.circular(12),
                          child: Container(
                            width: 48,
                            height: 48,
                            decoration: BoxDecoration(
                              color: AppColors.overlayWhiteLight,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: AppColors.textPrimaryLight.withValues(
                                  alpha: 0.1,
                                ),
                                width: 1,
                              ),
                            ),
                            child: Icon(
                              Icons.compare_arrows,
                              size: 20,
                              color: AppColors.primaryLight,
                            ),
                          ),
                        ),
                        Positioned.fill(
                          child: IgnorePointer(
                            child: Tooltip(
                              message:
                                  AppLocalizations.of(context)?.compare ??
                                  'Karşılaştır',
                              child: SizedBox.expand(),
                            ),
                          ),
                        ),
                        if (compareProvider.count > 0)
                          Positioned(
                            right: 0,
                            top: 0,
                            child: Container(
                              padding: const EdgeInsets.all(4),
                              decoration: BoxDecoration(
                                color: AppColors.error,
                                shape: BoxShape.circle,
                              ),
                              constraints: const BoxConstraints(
                                minWidth: 18,
                                minHeight: 18,
                              ),
                              child: Center(
                                child: Text(
                                  '${compareProvider.count}',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ),
                          ),
                      ],
                    );
                  },
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
