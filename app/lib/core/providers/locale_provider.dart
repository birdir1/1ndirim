import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Dil Yönetimi Provider'ı
class LocaleProvider extends ChangeNotifier {
  static const String _keyLocale = 'app_locale';
  Locale _locale = const Locale('tr'); // Varsayılan Türkçe

  Locale get locale => _locale;

  LocaleProvider() {
    _loadLocale();
  }

  /// Kaydedilmiş dili yükler
  Future<void> _loadLocale() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final localeCode = prefs.getString(_keyLocale);
      if (localeCode != null) {
        _locale = Locale(localeCode);
        notifyListeners();
      }
    } catch (e) {
      // Hata durumunda varsayılan dil kullanılır
    }
  }

  /// Dili değiştirir ve kaydeder
  Future<void> setLocale(Locale locale) async {
    if (_locale == locale) return;

    _locale = locale;
    notifyListeners();

    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_keyLocale, locale.languageCode);
    } catch (e) {
      // Hata durumunda sadece hafızada güncellenir
    }
  }

  /// Desteklenen diller
  static const List<Locale> supportedLocales = [
    Locale('tr'),
    Locale('en'),
  ];

  /// Dil isimleri
  static const Map<String, String> languageNames = {
    'tr': 'Türkçe',
    'en': 'English',
  };
}
