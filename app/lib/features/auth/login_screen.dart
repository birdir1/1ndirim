import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/services/preferences_service.dart';
import '../../core/services/auth_service.dart';
import '../../features/main_shell/main_shell.dart';
import '../../features/onboarding/onboarding_screen.dart';

class LoginScreen extends StatefulWidget {
  final VoidCallback? onAuthComplete;
  
  const LoginScreen({super.key, this.onAuthComplete});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  bool _isLoading = false;

  /// Apple Sign-In handler
  Future<void> _handleAppleSignIn() async {
    if (_isLoading) return;

    setState(() {
      _isLoading = true;
    });

    try {
      final authService = AuthService.instance;
      final result = await authService.signInWithApple();

      if (!mounted) return;

      if (result == null) {
        // Kullanıcı iptal etti
        setState(() {
          _isLoading = false;
        });
        return;
      }

      // Login başarılı - Firebase Auth zaten user oluşturdu
      final prefsService = PreferencesService.instance;
      // Kullanıcı adını kaydet
      if (result.name != null && result.name!.isNotEmpty) {
        await prefsService.setUserName(result.name!);
      }

      if (!mounted) return;

      setState(() {
        _isLoading = false;
      });

      // Navigation
      if (widget.onAuthComplete != null) {
        widget.onAuthComplete!();
      } else {
        final onboardingComplete = await prefsService.isOnboardingComplete();
        if (!mounted) return;

        if (onboardingComplete) {
          Navigator.of(context).pushReplacement(
            MaterialPageRoute(
              builder: (context) => const MainShell(),
            ),
          );
        } else {
          Navigator.of(context).pushReplacement(
            MaterialPageRoute(
              builder: (context) => OnboardingScreen(
                onComplete: () {
                  Navigator.of(context).pushReplacement(
                    MaterialPageRoute(
                      builder: (context) => const MainShell(),
                    ),
                  );
                },
              ),
            ),
          );
        }
      }
    } on AuthException catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.message),
            backgroundColor: AppColors.error,
            duration: const Duration(seconds: 3),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Apple ile giriş yapılırken bir hata oluştu: ${e.toString()}'),
            backgroundColor: AppColors.error,
            duration: const Duration(seconds: 3),
          ),
        );
      }
    }
  }

  /// Google Sign-In handler
  Future<void> _handleGoogleSignIn() async {
    if (_isLoading) return;

    setState(() {
      _isLoading = true;
    });

    try {
      final authService = AuthService.instance;
      final result = await authService.signInWithGoogle();

      if (!mounted) return;

      if (result == null) {
        // Kullanıcı iptal etti
        setState(() {
          _isLoading = false;
        });
        return;
      }

      // Login başarılı - Firebase Auth zaten user oluşturdu
      final prefsService = PreferencesService.instance;
      // Kullanıcı adını kaydet
      if (result.name != null && result.name!.isNotEmpty) {
        await prefsService.setUserName(result.name!);
      }

      if (!mounted) return;

      setState(() {
        _isLoading = false;
      });

      // Navigation
      if (widget.onAuthComplete != null) {
        widget.onAuthComplete!();
      } else {
        final onboardingComplete = await prefsService.isOnboardingComplete();
        if (!mounted) return;

        if (onboardingComplete) {
          Navigator.of(context).pushReplacement(
            MaterialPageRoute(
              builder: (context) => const MainShell(),
            ),
          );
        } else {
          Navigator.of(context).pushReplacement(
            MaterialPageRoute(
              builder: (context) => OnboardingScreen(
                onComplete: () {
                  Navigator.of(context).pushReplacement(
                    MaterialPageRoute(
                      builder: (context) => const MainShell(),
                    ),
                  );
                },
              ),
            ),
          );
        }
      }
    } on AuthException catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.message),
            backgroundColor: AppColors.error,
            duration: const Duration(seconds: 3),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Google ile giriş yapılırken bir hata oluştu: ${e.toString()}'),
            backgroundColor: AppColors.error,
            duration: const Duration(seconds: 5),
          ),
        );
      }
    }
  }

  @override
  void dispose() {
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundLight, // #FFF2C6
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
                const SizedBox(height: 40),
                // Logo
                Center(
                  child: Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      color: AppColors.secondaryLight, // #8CA9FF
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Center(
                      child: Text(
                        '1%',
                        style: AppTextStyles.title(isDark: false).copyWith(
                          fontSize: 36,
                          fontWeight: FontWeight.bold,
                          color: AppColors.cardBackground,
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 32),
                
                // Title
                Center(
                  child: Text(
                    'Bir İndirim',
                    style: AppTextStyles.title(isDark: false),
                  ),
                ),
                const SizedBox(height: 12),
                
                // Subtitle
                Center(
                  child: Text(
                    'Aslında hakkın olan fakat bilmediğin fırsatlarını görmeye hazır mısın?',
                    style: AppTextStyles.bodySecondary(isDark: false),
                    textAlign: TextAlign.center,
                  ),
                ),
                const SizedBox(height: 32),

                // Referans Kodu (Opsiyonel)
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.cardBackground,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: AppColors.textSecondaryLight.withOpacity(0.2),
                      width: 1,
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(
                            Icons.card_giftcard,
                            size: 18,
                            color: AppColors.primaryLight,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            'Referans Kodunuz Var mı?',
                            style: AppTextStyles.body(isDark: false).copyWith(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _referralCodeController,
                        decoration: InputDecoration(
                          hintText: 'Referans kodunu girin (opsiyonel)',
                          hintStyle: AppTextStyles.bodySecondary(isDark: false).copyWith(
                            fontSize: 14,
                          ),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(
                              color: AppColors.textSecondaryLight.withOpacity(0.2),
                            ),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(
                              color: AppColors.textSecondaryLight.withOpacity(0.2),
                            ),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(
                              color: AppColors.primaryLight,
                              width: 2,
                            ),
                          ),
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 12,
                          ),
                        ),
                        style: AppTextStyles.body(isDark: false).copyWith(
                          fontSize: 14,
                          letterSpacing: 1.5,
                        ),
                        textAlign: TextAlign.center,
                        textCapitalization: TextCapitalization.characters,
                        maxLength: 8,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Referans kodu ile kayıt olarak bonus puan kazanabilirsiniz',
                        style: AppTextStyles.caption(isDark: false).copyWith(
                          fontSize: 11,
                          color: AppColors.textSecondaryLight,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // Apple Login Button
                // NOT: Apple Sign-In için ücretli Apple Developer Program gerekiyor ($99/yıl)
                // Personal Team ile çalışmaz. Şimdilik gizli.
                // Apple Developer Program'a kaydolduktan sonra aşağıdaki yorumu kaldırın:
                /*
                if (Platform.isIOS)
                  SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: OutlinedButton(
                      onPressed: _isLoading ? null : _handleAppleSignIn,
                    style: OutlinedButton.styleFrom(
                      backgroundColor: AppColors.cardBackground,
                      foregroundColor: AppColors.textPrimaryLight,
                      side: BorderSide(
                        color: AppColors.textSecondaryLight.withOpacity(0.2),
                        width: 1,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.apple, size: 24, color: AppColors.textPrimaryLight),
                        const SizedBox(width: 12),
                        Text(
                          'Apple ile Giriş Yap',
                          style: AppTextStyles.button(color: AppColors.textPrimaryLight),
                        ),
                      ],
                    ),
                  ),
                  ),
                if (Platform.isIOS) const SizedBox(height: 12),
                */

                // Google Login Button
                SizedBox(
                  width: double.infinity,
                  height: 56,
                  child: OutlinedButton(
                    onPressed: _isLoading ? null : _handleGoogleSignIn,
                    style: OutlinedButton.styleFrom(
                      backgroundColor: AppColors.cardBackground,
                      foregroundColor: AppColors.textPrimaryLight,
                      side: BorderSide(
                        color: AppColors.textSecondaryLight.withOpacity(0.2),
                        width: 1,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        CachedNetworkImage(
                          imageUrl: 'https://www.google.com/favicon.ico',
                          width: 24,
                          height: 24,
                          fit: BoxFit.contain,
                          placeholder: (context, url) => const SizedBox(
                            width: 24,
                            height: 24,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          ),
                          errorWidget: (context, url, error) => const Icon(
                            Icons.error_outline,
                            size: 24,
                            color: AppColors.textSecondaryLight,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Text(
                          'Google ile Giriş Yap',
                          style: AppTextStyles.button(color: AppColors.textPrimaryLight),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 32),

                // Footer Text
                Center(
                  child: Text(
                    'Verilerin şifrelenmiş olarak korunur.',
                    style: AppTextStyles.caption(isDark: false).copyWith(
                      fontSize: 12,
                      color: AppColors.textSecondaryLight,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
              ],
            ),
          ),
        ),
    );
  }
}
