import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';

class SplashScreen extends StatefulWidget {
  final VoidCallback onComplete;

  const SplashScreen({super.key, required this.onComplete});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    // Hide status bar for splash
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersive);
    
    // Auto-transition after 2.5 seconds
    Future.delayed(const Duration(milliseconds: 2500), () {
      if (mounted) {
        SystemChrome.setEnabledSystemUIMode(
          SystemUiMode.edgeToEdge,
          overlays: SystemUiOverlay.values,
        );
        widget.onComplete();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundLight, // Tam beyaz
      body: Stack(
        children: [
          // Top Icon (Shopping Bag) - centered horizontally near top
          Positioned(
            top: 60,
            left: 0,
            right: 0,
            child: Center(
              child: Icon(
                Icons.shopping_bag_outlined,
                size: 32,
                color: AppColors.splashIcon,
              ),
            ),
          ),

          // Main Logo - Centered vertically
          Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Large "1" number
                Text(
                  '1',
                  style: TextStyle(
                    fontSize: 120,
                    fontWeight: FontWeight.w700,
                    color: AppColors.primaryLight, // Canlı Mavi (#007AFF)
                    height: 1.0,
                    letterSpacing: -4,
                  ),
                ),
                const SizedBox(height: 8),
                // "Bir İndirim" text
                Text(
                  'Bir İndirim',
                  style: AppTextStyles.subtitle(isDark: false).copyWith(
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 12),
                // "Banka ve operatör fırsatları" text
                Text(
                  'Banka ve operatör fırsatları',
                  style: AppTextStyles.bodySecondary(isDark: false).copyWith(
                    fontSize: 16,
                    color: AppColors.textSecondaryLight,
                  ),
                ),
              ],
            ),
          ),

          // Bottom Right - "@birdir1" text
          Positioned(
            bottom: 40,
            right: 24,
            child: Text(
              '@birdir1',
              style: AppTextStyles.small(isDark: false).copyWith(
                color: AppColors.splashText,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
