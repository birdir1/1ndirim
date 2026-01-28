import 'package:flutter/material.dart';

/// 1ndirim App Color Palette
/// MAVİ TONLARI PALETİ
/// Arka plan beyaz, onboarding/splash mavi, vurgular mavi, indirimler kırmızı
/// 
/// Tema:
/// - Background: Tam beyaz
/// - Primary: Canlı Mavi (onboarding, splash, vurgular)
/// - Secondary: Açık Mavi (hover, ikincil vurgular)
/// - İndirim: Kan Kırmızısı (dikkat çekici vurgu)
class AppColors {
  // Light Theme - Beyaz arka plan, mavi vurgular
  static const backgroundLight = Color(0xFFFFFFFF); // Tam beyaz - Arka plan
  static const surfaceLight = Color(0xFFFFFFFF); // Saf beyaz - Kartlar
  static const primaryLight = Color(0xFF007AFF); // Canlı Mavi - Onboarding, splash, vurgular
  static const secondaryLight = Color(0xFF5AC8FA); // Açık Mavi - Hover, ikincil vurgular
  static const textPrimaryLight = Color(0xFF1F2937); // Koyu Gri - Okunabilir
  static const textSecondaryLight = Color(0xFF6B7280); // Orta Gri - Yumuşak

  // Dark Theme - Koyu arka plan, mavi vurgular
  static const backgroundDark = Color(0xFF1A1A1A); // Koyu gri - Göz yormayan
  static const surfaceDark = Color(0xFF252525); // Koyu gri kartlar
  static const primaryDark = Color(0xFF5AC8FA); // Açık Mavi - Dark mode için
  static const secondaryDark = Color(0xFF7DD3FC); // Daha açık Mavi - Dark mode hover
  static const textPrimaryDark = Color(0xFFF5F5F5); // Açık metin
  static const textSecondaryDark = Color(0xFFB0B0B0); // Orta açık metin

  // İNDİRİM VURGUSU - Kan Kırmızısı (Dikkat çekici, "Ben buradayım" diyecek)
  static const discountRed = Color(0xFFDC2626); // Kan Kırmızısı - İndirimler, vurgular
  static const discountRedLight = Color(0xFFFFEBEE); // Çok açık kırmızı - Arka plan

  // Accent Color (Özel özellikler için - mavi tonu)
  static const accent = Color(0xFF2563EB); // Koyu Mavi - Özel vurgular

  // Semantic Colors
  static const success = Color(0xFF10B981); // Yumuşak Yeşil
  static const error = Color(0xFFDC2626); // Kan Kırmızısı (discountRed ile aynı)
  static const warning = Color(0xFFF59E0B); // Yumuşak Turuncu

  // Opportunity Colors (Fırsat Kartları) - Mavi tonları + indirim kırmızısı
  static const opportunityRed = Color(0xFFDC2626); // Kan Kırmızısı (indirim vurgusu)
  static const opportunityRedLight = Color(0xFFFFEBEE); // Çok açık kırmızı
  static const opportunityGreen = Color(0xFF10B981); // Yumuşak Yeşil
  static const opportunityGreenLight = Color(0xFFECFDF5); // Açık Yeşil
  static const opportunityBlue = Color(0xFF007AFF); // Canlı Mavi (primary ile aynı)
  static const opportunityBlueLight = Color(0xFFEBF4FF); // Açık Mavi
  static const opportunityBlueSecondary = Color(0xFF5AC8FA); // Açık Mavi (secondary ile aynı)
  static const opportunityBlueSecondaryLight = Color(0xFFE0F2FE); // Çok açık mavi
  static const opportunityTeal = Color(0xFF14B8A6); // Yumuşak Teal
  static const opportunityTealLight = Color(0xFFF0FDFA); // Açık Teal

  // UI Component Colors - Minimal, şık
  static const cardBackground = Color(0xFFFFFFFF); // Saf beyaz
  static const divider = Color(0xFFE5E7EB); // Çok açık gri - Minimal
  static const dividerLight = Color(0xFFF5F5F5); // Neredeyse beyaz
  static const iconSecondary = Color(0xFF9CA3AF); // Yumuşak Gri - Göz yormayan
  static const iconSecondaryLight = Color(0xFFD1D5DB); // Açık Gri
  
  // Shadow Colors
  static const shadowLight = Color(0x1A000000); // black.withValues(alpha: 0.1)
  static const shadowMedium = Color(0x0D000000); // black.withValues(alpha: 0.05)
  static const shadowDark = Color(0x0A000000); // black.withValues(alpha: 0.04)
  
  // Badge & Tag Colors - Mavi tonları + indirim kırmızısı
  static const badgeBackground = Color(0xFFEBF4FF); // Açık Mavi - Vurgu alanları
  static const badgeText = Color(0xFF007AFF); // Canlı Mavi - Vurgu metinleri
  static const badgeTextSecondary = Color(0xFF5AC8FA); // Açık Mavi - İkincil vurgular
  static const badgeBackgroundSecondary = Color(0xFFE0F2FE); // Çok açık mavi
  // İndirim Badge - Kan Kırmızısı (vurgu için)
  static const badgeDiscountBackground = Color(0xFFFFEBEE); // Açık Kırmızı
  static const badgeDiscountText = Color(0xFFDC2626); // Kan Kırmızısı
  
  // Overlay Colors
  static const overlayWhite = Color(0xE6FFFFFF); // white.withValues(alpha: 0.9)
  static const overlayWhiteLight = Color(0x80FFFFFF); // white.withValues(alpha: 0.5)
  static const overlayWhiteVeryLight = Color(0x66FFFFFF); // white.withValues(alpha: 0.4)
  static const overlayBlack = Color(0x0D000000); // black.withValues(alpha: 0.05)
  
  // Text Colors (Additional) - Ahenkli tonlar
  static const textTertiary = Color(0xFF6B7280); // Orta Gri
  static const textQuaternary = Color(0xFF9CA3AF); // Açık Gri
  
  // Filter Colors (Kaynak Filtreleri) - Mavi tonları
  static const filterBlue = Color(0xFF007AFF); // Canlı Mavi (primary ile aynı)
  static const filterBlueLight = Color(0xFF5AC8FA); // Açık Mavi (secondary ile aynı)
  static const filterGreen = Color(0xFF10B981); // Yumuşak Yeşil
  static const filterTeal = Color(0xFF14B8A6); // Yumuşak Teal
  // İndirim Filtresi - Kan Kırmızısı
  static const filterDiscount = Color(0xFFDC2626); // Kan Kırmızısı
  
  // Notification Badge - Kan Kırmızısı (dikkat çekici)
  static const notificationBadge = Color(0xFFDC2626); // Kan Kırmızısı
  
  // Splash & Onboarding - Mavi
  static const splashIcon = Color(0xFF007AFF); // Canlı Mavi (primary ile aynı)
  static const splashText = Color(0xFF6B7280); // Orta Gri - Sade
  static const onboardingBackground = Color(0xFF007AFF); // Canlı Mavi - Onboarding arka plan
  static const onboardingText = Color(0xFFFFFFFF); // Beyaz - Onboarding metin
  
  // Hover & Interactive States - Mavi tonları
  static const buttonHover = Color(0xFF0051D5); // Koyu Mavi - Hover durumu
  static const buttonPressed = Color(0xFF003D9E); // Daha koyu Mavi - Press durumu
  static const interactiveBlue = Color(0xFF007AFF); // Canlı Mavi - İnteraktif öğeler
  static const interactiveBlueLight = Color(0xFFEBF4FF); // Açık Mavi - Hover arka plan

  // Helper methods
  static Color background(bool isDark) =>
      isDark ? backgroundDark : backgroundLight;
  static Color surface(bool isDark) => isDark ? surfaceDark : surfaceLight;
  static Color primary(bool isDark) => isDark ? primaryDark : primaryLight;
  static Color secondary(bool isDark) =>
      isDark ? secondaryDark : secondaryLight;
  static Color textPrimary(bool isDark) =>
      isDark ? textPrimaryDark : textPrimaryLight;
  static Color textSecondary(bool isDark) =>
      isDark ? textSecondaryDark : textSecondaryLight;
}
