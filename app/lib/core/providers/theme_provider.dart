import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Tema Yönetimi Provider'ı
class ThemeProvider extends ChangeNotifier {
  static const String _keyThemeMode = 'app_theme_mode';
  ThemeMode _themeMode = ThemeMode.light; // Varsayılan açık tema

  ThemeMode get themeMode => _themeMode;
  bool get isDarkMode => _themeMode == ThemeMode.dark;

  ThemeProvider() {
    _loadThemeMode();
  }

  /// Kaydedilmiş tema modunu yükler
  Future<void> _loadThemeMode() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final themeModeIndex = prefs.getInt(_keyThemeMode);
      if (themeModeIndex != null) {
        _themeMode = ThemeMode.values[themeModeIndex];
        notifyListeners();
      }
    } catch (e) {
      // Hata durumunda varsayılan tema kullanılır
    }
  }

  /// Tema modunu değiştirir ve kaydeder
  Future<void> setThemeMode(ThemeMode themeMode) async {
    if (_themeMode == themeMode) return;

    _themeMode = themeMode;
    notifyListeners();

    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setInt(_keyThemeMode, themeMode.index);
    } catch (e) {
      // Hata durumunda sadece hafızada güncellenir
    }
  }

  /// Dark mode'u toggle eder
  Future<void> toggleDarkMode() async {
    final newMode = _themeMode == ThemeMode.light
        ? ThemeMode.dark
        : ThemeMode.light;
    await setThemeMode(newMode);
  }
}
