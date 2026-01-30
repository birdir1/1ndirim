import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/services/preferences_service.dart';
import '../../../core/utils/page_transitions.dart';
import '../avatar_selection_screen.dart';

/// Profile Header Widget
class ProfileHeader extends StatefulWidget {
  const ProfileHeader({super.key});

  @override
  State<ProfileHeader> createState() => _ProfileHeaderState();
}

class _ProfileHeaderState extends State<ProfileHeader> {
  String? _userName;
  String? _userAvatar;
  bool _isLoading = true;

  // Avatar emoji map
  final Map<String, String> _avatarEmojis = {
    'man_1': '👨',
    'man_2': '👨‍💼',
    'man_3': '👨‍🎓',
    'man_4': '👨‍💻',
    'woman_1': '👩',
    'woman_2': '👩‍💼',
    'woman_3': '👩‍🎓',
    'woman_4': '👩‍💻',
    'person_1': '🧑',
    'person_2': '🧑‍💼',
    'person_3': '🧑‍🎓',
    'person_4': '🧑‍💻',
  };

  @override
  void initState() {
    super.initState();
    _loadUserData();
  }

  Future<void> _loadUserData() async {
    try {
      final prefsService = PreferencesService.instance;
      final name = await prefsService.getUserName();
      final avatar = await prefsService.getUserAvatar();
      if (mounted) {
        setState(() {
          _userName = name;
          _userAvatar = avatar;
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

  Future<void> _showAvatarSelection(BuildContext context) async {
    final result = await Navigator.of(context).push<String>(
      SlidePageRoute(
        child: AvatarSelectionScreen(currentAvatar: _userAvatar),
        direction: SlideDirection.right,
      ),
    );

    if (result != null && mounted) {
      setState(() {
        _userAvatar = result;
      });
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
              child:
                  _userAvatar != null && _avatarEmojis.containsKey(_userAvatar)
                  ? Center(
                      child: Text(
                        _avatarEmojis[_userAvatar]!,
                        style: const TextStyle(fontSize: 56),
                      ),
                    )
                  : Icon(
                      Icons.account_circle,
                      size: 56,
                      color: AppColors.secondaryLight,
                    ),
            ),
            Positioned(
              bottom: 0,
              right: 0,
              child: GestureDetector(
                onTap: () => _showAvatarSelection(context),
                child: Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: AppColors.secondaryLight,
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
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
          decoration: BoxDecoration(
            color: AppColors.overlayWhiteLight,
            borderRadius: BorderRadius.circular(20),
          ),
          child: Text(
            'Kişiselleştirilmiş kampanya deneyimi',
            style: AppTextStyles.caption(
              isDark: false,
            ).copyWith(fontWeight: FontWeight.w500),
          ),
        ),
      ],
    );
  }
}
