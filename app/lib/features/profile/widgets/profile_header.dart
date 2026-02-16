import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/services/preferences_service.dart';
import '../../../core/services/auth_service.dart';
import '../../../core/utils/page_transitions.dart';
import '../../auth/login_screen.dart';
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
  String? _photoUrl;
  bool _isLoading = true;
  bool _isAuthenticated = false;

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
      final firebaseUser = AuthService.instance.currentUser;
      _isAuthenticated = firebaseUser != null;

      final resolvedName =
          (firebaseUser?.displayName?.trim().isNotEmpty ?? false)
          ? firebaseUser!.displayName!.trim()
          : name;
      final resolvedPhoto = firebaseUser?.photoURL;

      if (mounted) {
        setState(() {
          _userName = resolvedName;
          _userAvatar = avatar;
          _photoUrl = resolvedPhoto;
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
    final hasAuth = AuthService.instance.currentUser != null;
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
              child: _photoUrl != null
                  ? ClipOval(
                      child: Image.network(
                        _photoUrl!,
                        width: 112,
                        height: 112,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => _buildAvatarFallback(),
                        loadingBuilder: (context, child, progress) {
                          if (progress == null) return child;
                          return _buildAvatarFallback(isLoading: true);
                        },
                      ),
                    )
                  : _buildAvatarFallback(),
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
        if (!hasAuth && !_isAuthenticated) ...[
          const SizedBox(height: 8),
          TextButton.icon(
            onPressed: () {
              Navigator.of(context).push(
                SlidePageRoute(
                  child: const LoginScreen(),
                  direction: SlideDirection.right,
                ),
              );
            },
            icon: const Icon(Icons.login),
            label: const Text('Giriş yap'),
          ),
        ],
      ],
    );
  }

  Widget _buildAvatarFallback({bool isLoading = false}) {
    if (_userAvatar != null && _avatarEmojis.containsKey(_userAvatar)) {
      return Center(
        child: Text(
          _avatarEmojis[_userAvatar]!,
          style: const TextStyle(fontSize: 56),
        ),
      );
    }
    return isLoading
        ? const Center(
            child: SizedBox(
              width: 28,
              height: 28,
              child: CircularProgressIndicator(strokeWidth: 3),
            ),
          )
        : Icon(Icons.account_circle, size: 56, color: AppColors.secondaryLight);
  }
}
