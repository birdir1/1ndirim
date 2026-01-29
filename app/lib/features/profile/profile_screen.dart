import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/services/preferences_service.dart';
import '../../core/utils/page_transitions.dart';
import '../../core/providers/theme_provider.dart';
import 'widgets/profile_header.dart';
import 'widgets/profile_menu_item.dart';
import 'widgets/sources_section.dart';
import 'widgets/notifications_section.dart';
import '../how_it_works/how_it_works_screen.dart';
import '../settings/kvkk_screen.dart';
import '../settings/terms_of_use_screen.dart';
import '../settings/language_settings_screen.dart';
import '../blog/blog_screen.dart';
import '../premium/premium_screen.dart';

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
        setState(() {
          _newOpportunitiesEnabled = !value;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Ayarlar kaydedilirken bir hata oluştu'),
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
        setState(() {
          _expiringOpportunitiesEnabled = !value;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Ayarlar kaydedilirken bir hata oluştu'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
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
          onPressed: () {
            Navigator.of(context).pop();
          },
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: 0,
                ),
                child: Column(
                  children: [
                    const SizedBox(height: 20),
                    const ProfileHeader(),
                    const SizedBox(height: 32),
                    const SourcesSection(),
                    const SizedBox(height: 20),
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
                    Column(
                      children: [
                        ProfileMenuItem(
                          icon: Icons.article,
                          title: 'Blog & Rehberler',
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
                          icon: Icons.star,
                          title: 'Premium Üyelik',
                          onTap: () {
                            Navigator.of(context).push(
                              SlidePageRoute(
                                child: const PremiumScreen(),
                                direction: SlideDirection.right,
                              ),
                            );
                          },
                        ),
                        ProfileMenuItem(
                          icon: Icons.help_outline,
                          title: 'Nasıl çalışır?',
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
                          icon: Icons.language,
                          title: 'Dil',
                          onTap: () {
                            Navigator.of(context).push(
                              SlidePageRoute(
                                child: const LanguageSettingsScreen(),
                                direction: SlideDirection.right,
                              ),
                            );
                          },
                        ),
                        Consumer<ThemeProvider>(
                          builder: (context, themeProvider, child) {
                            return ProfileMenuItem(
                              icon: themeProvider.isDarkMode
                                  ? Icons.light_mode
                                  : Icons.dark_mode,
                              title: themeProvider.isDarkMode
                                  ? 'Açık Tema'
                                  : 'Koyu Tema',
                              onTap: () async {
                                await themeProvider.toggleDarkMode();
                                if (context.mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      content: Text(
                                        themeProvider.isDarkMode
                                            ? 'Koyu tema aktif edildi'
                                            : 'Açık tema aktif edildi',
                                      ),
                                      backgroundColor: AppColors.success,
                                      duration: const Duration(seconds: 2),
                                    ),
                                  );
                                }
                              },
                            );
                          },
                        ),
                        ProfileMenuItem(
                          icon: Icons.lock_outline,
                          title: 'Gizlilik ve KVKK',
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
                          title: 'Kullanım şartları',
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
                    const SizedBox(height: 32),

                    // Hesaptan Çıkış Butonu
                    Container(
                      width: double.infinity,
                      margin: const EdgeInsets.symmetric(horizontal: 20),
                      child: ElevatedButton.icon(
                        onPressed: () async {
                          // Onay dialogu göster
                          final shouldLogout = await showDialog<bool>(
                            context: context,
                            builder: (context) => AlertDialog(
                              title: const Text('Hesaptan Çıkış'),
                              content: const Text(
                                'Hesaptan çıkmak istediğinizden emin misiniz?',
                              ),
                              actions: [
                                TextButton(
                                  onPressed: () =>
                                      Navigator.of(context).pop(false),
                                  child: const Text('İptal'),
                                ),
                                TextButton(
                                  onPressed: () =>
                                      Navigator.of(context).pop(true),
                                  style: TextButton.styleFrom(
                                    foregroundColor: AppColors.error,
                                  ),
                                  child: const Text('Çıkış Yap'),
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
                                  const SnackBar(
                                    content: Text('Başarıyla çıkış yapıldı'),
                                    backgroundColor: AppColors.success,
                                  ),
                                );
                              }
                            } catch (e) {
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text(
                                      'Çıkış yapılırken hata oluştu: $e',
                                    ),
                                    backgroundColor: AppColors.error,
                                  ),
                                );
                              }
                            }
                          }
                        },
                        icon: const Icon(Icons.logout),
                        label: const Text('Hesaptan Çıkış Yap'),
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
                          'birdir1 tarafından geliştirilmiştir',
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
