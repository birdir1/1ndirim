import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/services/preferences_service.dart';
import '../../../core/providers/premium_provider.dart';

/// Profile Header Widget
class ProfileHeader extends StatefulWidget {
  const ProfileHeader({super.key});

  @override
  State<ProfileHeader> createState() => _ProfileHeaderState();
}

class _ProfileHeaderState extends State<ProfileHeader> {
  String? _userName;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadUserName();
  }

  Future<void> _loadUserName() async {
    try {
      final prefsService = PreferencesService.instance;
      final name = await prefsService.getUserName();
      if (mounted) {
        setState(() {
          _userName = name;
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

  Future<void> _showEditDialog(BuildContext context) async {
    final TextEditingController nameController = TextEditingController(
      text: _userName ?? '',
    );

    return showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Profili Düzenle'),
        content: TextField(
          controller: nameController,
          decoration: const InputDecoration(
            labelText: 'İsim',
            hintText: 'Adınızı girin',
          ),
          autofocus: true,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('İptal'),
          ),
          TextButton(
            onPressed: () async {
              final newName = nameController.text.trim();
              if (newName.isNotEmpty) {
                try {
                  await PreferencesService.instance.setUserName(newName);
                  if (context.mounted) {
                    Navigator.of(context).pop();
                    setState(() {
                      _userName = newName;
                    });
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Profil güncellendi'),
                        backgroundColor: AppColors.success,
                      ),
                    );
                  }
                } catch (e) {
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Hata: $e'),
                        backgroundColor: AppColors.error,
                      ),
                    );
                  }
                }
              }
            },
            child: const Text('Kaydet'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Consumer<PremiumProvider>(
      builder: (context, premiumProvider, child) {
        final isPremium = premiumProvider.isPremium == true;
        final backgroundColor = isDark
            ? AppColors.backgroundDark
            : AppColors.backgroundLight;

        return Column(
          children: [
            Stack(
              children: [
                Container(
                  width: 112,
                  height: 112,
                  decoration: BoxDecoration(
                    color: isDark
                        ? AppColors.surfaceDark
                        : AppColors.cardBackground,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.shadowMedium,
                        blurRadius: 20,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Icon(
                    Icons.account_circle,
                    size: 56,
                    color: isPremium
                        ? AppColors.warning
                        : AppColors.secondaryLight,
                  ),
                ),
                Positioned(
                  bottom: 0,
                  right: 0,
                  child: GestureDetector(
                    onTap: () => _showEditDialog(context),
                    child: Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: AppColors.secondaryLight,
                        shape: BoxShape.circle,
                        border: Border.all(color: backgroundColor, width: 3),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.shadowLight,
                            blurRadius: 4,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: const Icon(
                        Icons.edit,
                        size: 16,
                        color: AppColors.cardBackground,
                      ),
                    ),
                  ),
                ),
                if (isPremium)
                  Positioned(
                    top: 0,
                    right: 0,
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        color: AppColors.warning,
                        shape: BoxShape.circle,
                        border: Border.all(color: backgroundColor, width: 2),
                      ),
                      child: const Icon(
                        Icons.star,
                        size: 16,
                        color: Colors.white,
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 16),
            Text(
              _isLoading
                  ? 'Hesabın'
                  : (_userName != null && _userName!.isNotEmpty
                        ? 'Sayın $_userName'
                        : 'Hesabın'),
              style: AppTextStyles.title(isDark: isDark),
            ),
            const SizedBox(height: 8),
            if (isPremium)
              Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      AppColors.warning,
                      AppColors.warning.withValues(alpha: 0.8),
                    ],
                  ),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.star, size: 14, color: Colors.white),
                    const SizedBox(width: 4),
                    Text(
                      'Premium',
                      style: AppTextStyles.caption(isDark: isDark).copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              decoration: BoxDecoration(
                color: isDark
                    ? AppColors.surfaceDark.withValues(alpha: 0.5)
                    : AppColors.overlayWhiteLight,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                'Sadece seçimlerinize göre çalışır',
                style: AppTextStyles.caption(isDark: isDark),
              ),
            ),
          ],
        );
      },
    );
  }
}
