import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'dart:io';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../widgets/app_bottom_navigation_bar.dart';
import '../home/home_screen.dart';
// V2 için: Discover ve Notifications geri eklenebilir
// import '../discover/discover_screen.dart';
// import '../notifications/notifications_screen.dart';

/// Ana Shell Widget - Bottom Navigation ile tüm ana ekranları yönetir
class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _currentIndex = 0;

  final List<Widget> _screens = const [
    HomeScreen(),
    // V2 için: Discover ve Notifications geri eklenebilir
    // DiscoverScreen(),
    // NotificationsScreen(),
  ];

  void _onTabTapped(int index) {
    setState(() {
      _currentIndex = index;
    });
  }

  DateTime? _lastBackPressed;

  Future<bool> _onWillPop() async {
    // Sadece Android'de double-tap kontrolü yap
    if (!Platform.isAndroid) {
      return true;
    }
    
    // Android'de geri tuşuna basıldığında uygulamadan çıkış için double-tap kontrolü
    final now = DateTime.now();
    if (_lastBackPressed == null || 
        now.difference(_lastBackPressed!) > const Duration(seconds: 2)) {
      _lastBackPressed = now;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Çıkmak için tekrar geri tuşuna bas',
            style: AppTextStyles.caption(isDark: false).copyWith(
              color: AppColors.cardBackground,
            ),
          ),
          backgroundColor: AppColors.textPrimaryLight,
          duration: const Duration(seconds: 2),
          behavior: SnackBarBehavior.floating,
        ),
      );
      return false;
    }
    return true;
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) async {
        if (!didPop) {
          // Nested navigator kontrolü - eğer bir ekran açıksa önce onu kapat
          if (Navigator.of(context).canPop()) {
            Navigator.of(context).pop();
            return;
          }
          
          // Ana ekrandaysak double-tap kontrolü yap
          final shouldPop = await _onWillPop();
          if (shouldPop && mounted) {
            // Uygulamadan çıkış
            SystemNavigator.pop();
          }
        }
      },
      child: Scaffold(
        backgroundColor: AppColors.backgroundLight,
        body: SafeArea(
          top: true,
          bottom: false, // Bottom navigation bar kendi SafeArea'sını yönetiyor
          child: IndexedStack(
            index: _currentIndex,
            children: _screens,
          ),
        ),
        bottomNavigationBar: AppBottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: _onTabTapped,
        ),
      ),
    );
  }
}
