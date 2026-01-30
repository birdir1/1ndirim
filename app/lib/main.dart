import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:provider/provider.dart';
import 'core/providers/compare_provider.dart';
import 'core/providers/locale_provider.dart';
import 'core/providers/premium_provider.dart';
import 'core/providers/theme_provider.dart';
import 'core/theme/app_theme.dart';
import 'core/l10n/app_localizations.dart';
import 'core/services/preferences_service.dart';
import 'core/services/auth_service.dart';
import 'core/services/notification_service.dart';
import 'core/services/crashlytics_service.dart';
import 'core/services/analytics_service.dart';
import 'core/providers/selected_sources_provider.dart';
import 'core/utils/app_logger.dart';
import 'features/splash/splash_screen.dart';
import 'features/auth/login_screen.dart';
import 'features/onboarding/onboarding_screen.dart';
import 'features/main_shell/main_shell.dart';

/// Background message handler (top-level function)
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  AppLogger.info('📨 Background mesaj alındı: ${message.notification?.title}');
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Firebase'i initialize et (hata durumunda uygulama çalışmaya devam eder)
  try {
    await Firebase.initializeApp();
    AppLogger.firebaseInit(true);

    // Crashlytics'i başlat (EN ÖNCELİKLİ)
    await CrashlyticsService().initialize();

    // Analytics'i başlat
    await AnalyticsService().initialize();

    // Background message handler'ı ayarla
    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

    // Notification service'i başlat
    await NotificationService().initialize();
  } catch (e) {
    AppLogger.firebaseInit(false, e);
    // Crashlytics'e hata gönder
    await CrashlyticsService().recordError(
      e,
      StackTrace.current,
      reason: 'Firebase initialization failed',
      fatal: true,
    );
  }

  // Set status bar style for iOS and Android
  // iOS: Dark content on light background
  // Android: Dark icons on light background
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent, // Transparent for edge-to-edge
      statusBarIconBrightness:
          Brightness.dark, // Dark icons for light background
      statusBarBrightness: Brightness.light, // iOS: Light status bar content
      systemNavigationBarColor:
          Colors.transparent, // Transparent navigation bar
      systemNavigationBarIconBrightness:
          Brightness.dark, // Dark navigation icons
    ),
  );

  runApp(const IndirimApp());
}

class IndirimApp extends StatelessWidget {
  const IndirimApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => LocaleProvider()),
        ChangeNotifierProvider(create: (_) => ThemeProvider()),
        ChangeNotifierProvider(
          create: (_) => PremiumProvider()..loadPremiumStatus(),
        ),
        ChangeNotifierProvider(
          create: (_) => SelectedSourcesProvider()..loadSelectedSources(),
        ),
        ChangeNotifierProvider(create: (_) => CompareProvider()),
      ],
      child: Consumer2<LocaleProvider, ThemeProvider>(
        builder: (context, localeProvider, themeProvider, child) {
          return MaterialApp(
            title: '1ndirim',
            debugShowCheckedModeBanner: false,
            theme: AppTheme.light(),
            darkTheme: AppTheme.dark(),
            themeMode: themeProvider.themeMode,
            locale: localeProvider.locale,
            localizationsDelegates: const [
              AppLocalizations.delegate,
              GlobalMaterialLocalizations.delegate,
              GlobalWidgetsLocalizations.delegate,
              GlobalCupertinoLocalizations.delegate,
            ],
            supportedLocales: LocaleProvider.supportedLocales,
            home: const AppNavigator(),
          );
        },
      ),
    );
  }
}

/// App Navigator - Splash -> Onboarding -> Home flow
class AppNavigator extends StatefulWidget {
  const AppNavigator({super.key});

  @override
  State<AppNavigator> createState() => _AppNavigatorState();
}

class _AppNavigatorState extends State<AppNavigator> {
  bool _showSplash = true;
  bool _showAuth = false;
  bool _showOnboarding = false;

  @override
  void initState() {
    super.initState();
  }

  void _onSplashComplete() {
    Future.microtask(() async {
      // Firebase Auth state kontrolü (otomatik login)
      final authService = AuthService.instance;
      final firebaseUser = authService.getCurrentFirebaseUser();
      final isLoggedIn = firebaseUser != null;

      // Eğer otomatik giriş yapılmışsa bildirim izni iste
      if (isLoggedIn) {
        try {
          await NotificationService().requestPermissionAndSetup();
        } catch (e) {
          AppLogger.warning('Bildirim izni istenemedi: $e');
        }
      }

      final prefsService = PreferencesService.instance;
      final onboardingComplete = await prefsService.isOnboardingComplete();

      if (!mounted) return;

      setState(() {
        _showSplash = false;
        if (isLoggedIn && onboardingComplete) {
          // Otomatik giriş yapılmış ve onboarding tamamlanmış, direkt ana ekrana git
          _showAuth = false;
          _showOnboarding = false;
        } else if (isLoggedIn && !onboardingComplete) {
          // Otomatik giriş yapılmış ama onboarding tamamlanmamış
          _showAuth = false;
          _showOnboarding = true;
        } else {
          // Giriş yapılmamış, login'e git
          _showAuth = true;
          _showOnboarding = false;
        }
      });
    });
  }

  void _onAuthComplete() {
    Future.microtask(() async {
      // Biraz bekle ki PreferencesService güncellemesi tamamlansın
      await Future.delayed(const Duration(milliseconds: 100));

      // Giriş yaptıktan sonra bildirim izni iste
      try {
        await NotificationService().requestPermissionAndSetup();
      } catch (e) {
        AppLogger.warning('Bildirim izni istenemedi: $e');
      }

      final prefsService = PreferencesService.instance;
      final onboardingComplete = await prefsService.isOnboardingComplete();

      if (!mounted) return;

      setState(() {
        _showAuth = false;
        if (!onboardingComplete) {
          _showOnboarding = true;
        }
      });
    });
  }

  Future<void> _onOnboardingComplete() async {
    if (!mounted) return;

    setState(() {
      _showOnboarding = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_showSplash) {
      return SplashScreen(onComplete: _onSplashComplete);
    }

    if (_showOnboarding) {
      return OnboardingScreen(onComplete: _onOnboardingComplete);
    }

    if (_showAuth) {
      return LoginScreen(onAuthComplete: _onAuthComplete);
    }

    return const MainShell();
  }
}
