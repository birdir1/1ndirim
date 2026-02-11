import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/theme/app_ui_tokens.dart';
import '../../core/services/preferences_service.dart';
import '../../core/utils/page_transitions.dart';
import '../../core/widgets/section_card.dart';
import '../../core/l10n/app_localizations.dart';
import 'widgets/profile_header.dart';
import 'widgets/profile_menu_item.dart';
import 'widgets/sources_section.dart';
import 'widgets/notifications_section.dart';
import '../how_it_works/how_it_works_screen.dart';
import '../settings/kvkk_screen.dart';
import '../settings/terms_of_use_screen.dart';
import '../blog/blog_screen.dart';
import '../price_tracking/price_tracking_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  bool _newOpportunitiesEnabled = true;
  bool _expiringOpportunitiesEnabled = false;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadNotificationSettings();
  }

  Future<void> _loadNotificationSettings() async {
    try {
      final prefsService = PreferencesService.instance;
      final newOpportunities = await prefsService
          .isNotificationNewOpportunitiesEnabled();
      final expiring = await prefsService.isNotificationExpiringEnabled();

      if (mounted) {
        setState(() {
          _newOpportunitiesEnabled = newOpportunities;
          _expiringOpportunitiesEnabled = expiring;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _updateNotificationNewOpportunities(bool value) async {
    setState(() {
      _newOpportunitiesEnabled = value;
    });

    try {
      final prefsService = PreferencesService.instance;
      await prefsService.setNotificationNewOpportunities(value);
    } catch (e) {
      // Hata durumunda geri al
      if (mounted) {
        final l10n = AppLocalizations.of(context)!;
        setState(() {
          _newOpportunitiesEnabled = !value;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(l10n.profileSettingsSaveError),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  Future<void> _updateNotificationExpiring(bool value) async {
    setState(() {
      _expiringOpportunitiesEnabled = value;
    });

    try {
      final prefsService = PreferencesService.instance;
      await prefsService.setNotificationExpiring(value);
    } catch (e) {
      // Hata durumunda geri al
      if (mounted) {
        final l10n = AppLocalizations.of(context)!;
        setState(() {
          _expiringOpportunitiesEnabled = !value;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(l10n.profileSettingsSaveError),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppUiTokens.screenPadding,
                  vertical: 0,
                ),
                child: Column(
                  children: [
                    const SizedBox(height: 20),
                    const ProfileHeader(),
                    const SizedBox(height: 32),
                    const SourcesSection(),
                    const SizedBox(height: AppUiTokens.sectionGap),
                    NotificationsSection(
                      newOpportunitiesEnabled: _newOpportunitiesEnabled,
                      expiringOpportunitiesEnabled:
                          _expiringOpportunitiesEnabled,
                      isLoading: _isLoading,
                      onNewOpportunitiesChanged:
                          _updateNotificationNewOpportunities,
                      onExpiringChanged: _updateNotificationExpiring,
                    ),
                    const SizedBox(height: 12),
                    SectionCard(
                      child: Column(
                        children: [
                          ProfileMenuItem(
                            icon: Icons.trending_down,
                            title: l10n.priceTracking,
                            subtitle: l10n.profileTrackSubtitle,
                            onTap: () {
                              Navigator.of(context).push(
                                SlidePageRoute(
                                  child: const PriceTrackingScreen(),
                                  direction: SlideDirection.right,
                                ),
                              );
                            },
                          ),
                          ProfileMenuItem(
                            icon: Icons.article,
                            title: l10n.blogTitle,
                            onTap: () {
                              Navigator.of(context).push(
                                SlidePageRoute(
                                  child: const BlogScreen(),
                                  direction: SlideDirection.right,
                                ),
                              );
                            },
                          ),
                          ProfileMenuItem(
                            icon: Icons.help_outline,
                            title: l10n.howItWorksShort,
                            onTap: () {
                              Navigator.of(context).push(
                                SlidePageRoute(
                                  child: const HowItWorksScreen(),
                                  direction: SlideDirection.right,
                                ),
                              );
                            },
                          ),
                          ProfileMenuItem(
                            icon: Icons.lock_outline,
                            title: l10n.privacyKvkk,
                            onTap: () {
                              Navigator.of(context).push(
                                SlidePageRoute(
                                  child: const KVKKScreen(),
                                  direction: SlideDirection.right,
                                ),
                              );
                            },
                          ),
                          ProfileMenuItem(
                            icon: Icons.description_outlined,
                            title: l10n.terms,
                            onTap: () {
                              Navigator.of(context).push(
                                SlidePageRoute(
                                  child: const TermsOfUseScreen(),
                                  direction: SlideDirection.right,
                                ),
                              );
                            },
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 32),

                    // Hesaptan Çıkış Butonu
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: () async {
                          // Onay dialogu göster
                          final shouldLogout = await showDialog<bool>(
                            context: context,
                            builder: (context) => AlertDialog(
                              title: Text(l10n.profileLogoutTitle),
                              content: Text(l10n.profileLogoutConfirm),
                              actions: [
                                TextButton(
                                  onPressed: () =>
                                      Navigator.of(context).pop(false),
                                  child: Text(l10n.cancel),
                                ),
                                TextButton(
                                  onPressed: () =>
                                      Navigator.of(context).pop(true),
                                  style: TextButton.styleFrom(
                                    foregroundColor: AppColors.error,
                                  ),
                                  child: Text(l10n.logout),
                                ),
                              ],
                            ),
                          );

                          if (shouldLogout == true && context.mounted) {
                            try {
                              // Firebase'den çıkış yap
                              await FirebaseAuth.instance.signOut();

                              // Preferences'ları temizle
                              await PreferencesService.instance.clearAll();

                              // Ana sayfaya yönlendir ve tüm stack'i temizle
                              if (context.mounted) {
                                Navigator.of(context).pushNamedAndRemoveUntil(
                                  '/',
                                  (route) => false,
                                );

                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text(l10n.profileLogoutSuccess),
                                    backgroundColor: AppColors.success,
                                  ),
                                );
                              }
                            } catch (e) {
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text(
                                      '${l10n.profileLogoutError}: $e',
                                    ),
                                    backgroundColor: AppColors.error,
                                  ),
                                );
                              }
                            }
                          }
                        },
                        icon: const Icon(Icons.logout),
                        label: Text(l10n.logout),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.error,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                    ),

                    const SizedBox(height: 32),

                    // Footer
                    Column(
                      children: [
                        Text(
                          '1ndirim v1.0',
                          style: AppTextStyles.small(isDark: false).copyWith(
                            fontWeight: FontWeight.bold,
                            color: AppColors.textSecondaryLight.withValues(
                              alpha: 0.8,
                            ),
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          l10n.developedBy,
                          style: AppTextStyles.small(isDark: false).copyWith(
                            fontSize: 10,
                            color: AppColors.textSecondaryLight.withValues(
                              alpha: 0.6,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 100), // Space for bottom nav
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
