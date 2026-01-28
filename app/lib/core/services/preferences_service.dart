import 'package:shared_preferences/shared_preferences.dart';

/// Merkezi Preferences Yönetim Servisi
/// Tüm SharedPreferences erişimleri bu servis üzerinden yapılır
class PreferencesService {
  // Key'ler - Hardcoded string'ler burada tanımlı
  // Not: _keyIsLoggedIn kaldırıldı (Firebase Auth kullanılıyor)
  static const String _keyOnboardingComplete = 'onboarding_complete';
  static const String _keyNotificationNewOpportunities = 'notification_new_opportunities';
  static const String _keyNotificationExpiring = 'notification_expiring';
  static const String _keyUserName = 'user_name';
  static const String _keyLocale = 'app_locale';

  // Singleton instance
  static PreferencesService? _instance;
  static PreferencesService get instance {
    _instance ??= PreferencesService._();
    return _instance!;
  }

  PreferencesService._();

  // SharedPreferences instance
  SharedPreferences? _prefs;

  /// SharedPreferences instance'ını başlatır
  Future<void> _init() async {
    _prefs ??= await SharedPreferences.getInstance();
  }

  // ========== Auth Methods ==========
  // Not: Login state artık Firebase Auth ile yönetiliyor
  // isLoggedIn ve setLoggedIn metodları kaldırıldı

  /// Kullanıcı adını kaydeder
  Future<bool> setUserName(String? name) async {
    try {
      await _init();
      if (name == null || name.isEmpty) {
        return await _prefs!.remove(_keyUserName);
      }
      return await _prefs!.setString(_keyUserName, name);
    } catch (e) {
      return false;
    }
  }

  /// Kaydedilmiş kullanıcı adını getirir
  Future<String?> getUserName() async {
    try {
      await _init();
      return _prefs!.getString(_keyUserName);
    } catch (e) {
      return null;
    }
  }

  // ========== Onboarding Methods ==========

  /// Onboarding'in tamamlanıp tamamlanmadığını kontrol eder
  Future<bool> isOnboardingComplete() async {
    try {
      await _init();
      return _prefs!.getBool(_keyOnboardingComplete) ?? false;
    } catch (e) {
      return false;
    }
  }

  /// Onboarding tamamlanma durumunu kaydeder
  Future<bool> setOnboardingComplete(bool value) async {
    try {
      await _init();
      return await _prefs!.setBool(_keyOnboardingComplete, value);
    } catch (e) {
      return false;
    }
  }

  // ========== Notification Settings Methods ==========

  /// Yeni fırsatlar bildiriminin açık olup olmadığını kontrol eder
  Future<bool> isNotificationNewOpportunitiesEnabled() async {
    try {
      await _init();
      return _prefs!.getBool(_keyNotificationNewOpportunities) ?? true; // Default: true
    } catch (e) {
      return true;
    }
  }

  /// Yeni fırsatlar bildirimini ayarlar
  Future<bool> setNotificationNewOpportunities(bool value) async {
    try {
      await _init();
      return await _prefs!.setBool(_keyNotificationNewOpportunities, value);
    } catch (e) {
      return false;
    }
  }

  /// Süresi dolmak üzere olanlar bildiriminin açık olup olmadığını kontrol eder
  Future<bool> isNotificationExpiringEnabled() async {
    try {
      await _init();
      return _prefs!.getBool(_keyNotificationExpiring) ?? false; // Default: false
    } catch (e) {
      return false;
    }
  }

  /// Süresi dolmak üzere olanlar bildirimini ayarlar
  Future<bool> setNotificationExpiring(bool value) async {
    try {
      await _init();
      return await _prefs!.setBool(_keyNotificationExpiring, value);
    } catch (e) {
      return false;
    }
  }

  // ========== Utility Methods ==========

  /// Tüm kullanıcı verilerini temizler (logout için)
  Future<bool> clearAll() async {
    try {
      await _init();
      return await _prefs!.clear();
    } catch (e) {
      return false;
    }
  }

  /// Sadece auth verilerini temizler (logout için)
  /// Not: Firebase Auth signOut ayrıca AuthService'de yapılmalı
  Future<bool> clearAuthData() async {
    try {
      await _init();
      // _keyIsLoggedIn kaldırıldı (Firebase Auth kullanılıyor)
      await _prefs!.remove(_keyOnboardingComplete);
      await _prefs!.remove(_keyUserName);
      return true;
    } catch (e) {
      return false;
    }
  }

}
