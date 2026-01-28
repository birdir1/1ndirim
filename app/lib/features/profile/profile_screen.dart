import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/services/preferences_service.dart';
import '../../core/utils/page_transitions.dart';
import 'widgets/profile_header.dart';
import 'widgets/profile_menu_item.dart';
import 'widgets/sources_section.dart';
import 'widgets/notifications_section.dart';
import 'widgets/stats_section.dart';
import 'widgets/gamification_section.dart';
import '../../data/repositories/user_stats_repository.dart';
import '../../data/models/user_stats_model.dart';
import '../../core/utils/network_result.dart';
import '../how_it_works/how_it_works_screen.dart';
import '../settings/kvkk_screen.dart';
import '../settings/terms_of_use_screen.dart';
import '../settings/language_settings_screen.dart';
import '../community/community_screen.dart';
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
  bool _isLoadingStats = true;
  NetworkResult<UserStatsModel>? _statsResult;
  final UserStatsRepository _statsRepository = UserStatsRepository.instance;

  @override
  void initState() {
    super.initState();
    _loadNotificationSettings();
    _loadUserStats();
  }

  Future<void> _loadUserStats() async {
    setState(() {
      _isLoadingStats = true;
    });

    final result = await _statsRepository.getUserStats();

    if (mounted) {
      setState(() {
        _statsResult = result;
        _isLoadingStats = false;
      });
    }
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
    return Scaffold(
      backgroundColor: AppColors.backgroundLight, // #FFF2C6
      appBar: AppBar(
        backgroundColor: AppColors.backgroundLight,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.textPrimaryLight),
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
                    StatsSection(
                      statsResult: _statsResult,
                      isLoading: _isLoadingStats,
                    ),
                    const SizedBox(height: 20),
                    const GamificationSection(),
                    const SizedBox(height: 20),
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
                          icon: Icons.people,
                          title: 'Topluluk',
                          onTap: () {
                            Navigator.of(context).push(
                              SlidePageRoute(
                                child: const CommunityScreen(),
                                direction: SlideDirection.right,
                              ),
                            );
                          },
                        ),
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
