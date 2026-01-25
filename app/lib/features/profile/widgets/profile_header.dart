import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/services/preferences_service.dart';

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

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Stack(
          children: [
            Container(
              width: 112,
              height: 112,
              decoration: BoxDecoration(
                color: AppColors.cardBackground,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: AppColors.shadowMedium,
                    blurRadius: 20,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: const Icon(
                Icons.account_circle,
                size: 56,
                color: AppColors.secondaryLight, // #8CA9FF
              ),
            ),
            Positioned(
              bottom: 0,
              right: 0,
              child: Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: AppColors.secondaryLight, // #8CA9FF
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: AppColors.backgroundLight,
                    width: 3,
                  ),
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
          ],
        ),
        const SizedBox(height: 16),
        Text(
          _isLoading
              ? 'Hesabın'
              : (_userName != null && _userName!.isNotEmpty
                  ? 'Sayın $_userName'
                  : 'Hesabın'),
          style: AppTextStyles.title(isDark: false),
        ),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.symmetric(
            horizontal: 16,
            vertical: 6,
          ),
          decoration: BoxDecoration(
            color: AppColors.overlayWhiteLight,
            borderRadius: BorderRadius.circular(20),
          ),
          child: Text(
            'Sadece seçimlerinize göre çalışır',
            style: AppTextStyles.caption(isDark: false),
          ),
        ),
      ],
    );
  }
}
