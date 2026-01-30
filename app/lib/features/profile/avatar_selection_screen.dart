import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/services/preferences_service.dart';

/// Avatar Selection Screen
class AvatarSelectionScreen extends StatefulWidget {
  final String? currentAvatar;

  const AvatarSelectionScreen({super.key, this.currentAvatar});

  @override
  State<AvatarSelectionScreen> createState() => _AvatarSelectionScreenState();
}

class _AvatarSelectionScreenState extends State<AvatarSelectionScreen> {
  String? _selectedAvatar;

  // Avatar listesi - emoji kullanarak basit ve etkili
  final List<Map<String, dynamic>> _avatars = [
    {'id': 'man_1', 'emoji': '👨', 'label': 'Erkek 1'},
    {'id': 'man_2', 'emoji': '👨‍💼', 'label': 'Erkek 2'},
    {'id': 'man_3', 'emoji': '👨‍🎓', 'label': 'Erkek 3'},
    {'id': 'man_4', 'emoji': '👨‍💻', 'label': 'Erkek 4'},
    {'id': 'woman_1', 'emoji': '👩', 'label': 'Kadın 1'},
    {'id': 'woman_2', 'emoji': '👩‍💼', 'label': 'Kadın 2'},
    {'id': 'woman_3', 'emoji': '👩‍🎓', 'label': 'Kadın 3'},
    {'id': 'woman_4', 'emoji': '👩‍💻', 'label': 'Kadın 4'},
    {'id': 'person_1', 'emoji': '🧑', 'label': 'Kişi 1'},
    {'id': 'person_2', 'emoji': '🧑‍💼', 'label': 'Kişi 2'},
    {'id': 'person_3', 'emoji': '🧑‍🎓', 'label': 'Kişi 3'},
    {'id': 'person_4', 'emoji': '🧑‍💻', 'label': 'Kişi 4'},
  ];

  @override
  void initState() {
    super.initState();
    _selectedAvatar = widget.currentAvatar;
  }

  Future<void> _saveAvatar() async {
    if (_selectedAvatar == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Lütfen bir avatar seçin'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    try {
      await PreferencesService.instance.setUserAvatar(_selectedAvatar!);
      if (mounted) {
        Navigator.of(context).pop(_selectedAvatar);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Avatar güncellendi'),
            backgroundColor: AppColors.success,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Hata: $e'), backgroundColor: AppColors.error),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      appBar: AppBar(
        backgroundColor: AppColors.backgroundLight,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.textPrimaryLight),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text('Avatar Seç', style: AppTextStyles.headline(isDark: false)),
        centerTitle: true,
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: GridView.builder(
                padding: const EdgeInsets.all(20),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 3,
                  crossAxisSpacing: 16,
                  mainAxisSpacing: 16,
                  childAspectRatio: 1,
                ),
                itemCount: _avatars.length,
                itemBuilder: (context, index) {
                  final avatar = _avatars[index];
                  final isSelected = _selectedAvatar == avatar['id'];

                  return GestureDetector(
                    onTap: () {
                      setState(() {
                        _selectedAvatar = avatar['id'] as String;
                      });
                    },
                    child: Container(
                      decoration: BoxDecoration(
                        color: AppColors.cardBackground,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: isSelected
                              ? AppColors.primaryLight
                              : AppColors.dividerLight,
                          width: isSelected ? 3 : 1,
                        ),
                        boxShadow: isSelected
                            ? [
                                BoxShadow(
                                  color: AppColors.primaryLight.withValues(
                                    alpha: 0.3,
                                  ),
                                  blurRadius: 12,
                                  offset: const Offset(0, 4),
                                ),
                              ]
                            : [
                                BoxShadow(
                                  color: AppColors.shadowLight,
                                  blurRadius: 4,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            avatar['emoji'] as String,
                            style: const TextStyle(fontSize: 48),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            avatar['label'] as String,
                            style: AppTextStyles.caption(isDark: false)
                                .copyWith(
                                  fontSize: 11,
                                  fontWeight: isSelected
                                      ? FontWeight.bold
                                      : FontWeight.w500,
                                  color: isSelected
                                      ? AppColors.primaryLight
                                      : AppColors.textSecondaryLight,
                                ),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(20),
              child: SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: _selectedAvatar != null ? _saveAvatar : null,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _selectedAvatar != null
                        ? AppColors.primaryLight
                        : AppColors.textSecondaryLight,
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                  child: Text(
                    'Kaydet',
                    style: AppTextStyles.button(
                      color: Colors.white,
                    ).copyWith(fontSize: 16, fontWeight: FontWeight.w600),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
