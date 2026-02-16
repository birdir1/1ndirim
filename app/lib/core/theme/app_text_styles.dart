import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'app_colors.dart';

/// 1ndirim Typography System
/// Font: Poppins (Modern, clean, readable)
class AppTextStyles {
  static String get _fontFamily {
    if (GoogleFonts.config.allowRuntimeFetching == false) {
      return 'Roboto';
    }
    try {
      return GoogleFonts.poppins().fontFamily ?? 'Roboto';
    } catch (_) {
      return 'Roboto';
    }
  }

  // Headline - 28px bold
  static TextStyle headline({bool isDark = false}) {
    return TextStyle(
      fontFamily: _fontFamily,
      fontSize: 28,
      fontWeight: FontWeight.bold,
      height: 1.2,
      color: AppColors.textPrimary(isDark),
    );
  }

  // Title - 24px bold
  static TextStyle title({bool isDark = false}) {
    return TextStyle(
      fontFamily: _fontFamily,
      fontSize: 24,
      fontWeight: FontWeight.bold,
      height: 1.3,
      color: AppColors.textPrimary(isDark),
    );
  }

  // Subtitle - 18px semibold
  static TextStyle subtitle({bool isDark = false}) {
    return TextStyle(
      fontFamily: _fontFamily,
      fontSize: 18,
      fontWeight: FontWeight.w600,
      height: 1.4,
      color: AppColors.textPrimary(isDark),
    );
  }

  // Body - 16px normal
  static TextStyle body({bool isDark = false}) {
    return TextStyle(
      fontFamily: _fontFamily,
      fontSize: 16,
      fontWeight: FontWeight.normal,
      height: 1.5,
      color: AppColors.textPrimary(isDark),
    );
  }

  // Body Secondary - 16px normal, secondary color
  static TextStyle bodySecondary({bool isDark = false}) {
    return TextStyle(
      fontFamily: _fontFamily,
      fontSize: 16,
      fontWeight: FontWeight.normal,
      height: 1.5,
      color: AppColors.textSecondary(isDark),
    );
  }

  // Caption - 14px normal
  static TextStyle caption({bool isDark = false}) {
    return TextStyle(
      fontFamily: _fontFamily,
      fontSize: 14,
      fontWeight: FontWeight.normal,
      height: 1.4,
      color: AppColors.textSecondary(isDark),
    );
  }

  // Small - 12px medium
  static TextStyle small({bool isDark = false}) {
    return TextStyle(
      fontFamily: _fontFamily,
      fontSize: 12,
      fontWeight: FontWeight.w500,
      height: 1.4,
      color: AppColors.textSecondary(isDark),
    );
  }

  // Button - 16px semibold
  static TextStyle button({Color? color}) {
    return TextStyle(
      fontFamily: _fontFamily,
      fontSize: 16,
      fontWeight: FontWeight.w600,
      color: color ?? Colors.white,
    );
  }

  // Page Title - 20px semibold (AppBar titles, page headers)
  static TextStyle pageTitle({bool isDark = false}) {
    return TextStyle(
      fontFamily: _fontFamily,
      fontSize: 20,
      fontWeight: FontWeight.w600,
      height: 1.3,
      color: AppColors.textPrimary(isDark),
    );
  }

  // Section Title - 18px bold (Section headers)
  static TextStyle sectionTitle({bool isDark = false}) {
    return TextStyle(
      fontFamily: _fontFamily,
      fontSize: 18,
      fontWeight: FontWeight.bold,
      height: 1.3,
      color: AppColors.textPrimary(isDark),
    );
  }

  // Card Title - 16px bold (Card headers)
  static TextStyle cardTitle({bool isDark = false}) {
    return TextStyle(
      fontFamily: _fontFamily,
      fontSize: 16,
      fontWeight: FontWeight.bold,
      height: 1.3,
      color: AppColors.textPrimary(isDark),
    );
  }

  // Card Subtitle - 13px medium (Card subtitles)
  static TextStyle cardSubtitle({bool isDark = false}) {
    return TextStyle(
      fontFamily: _fontFamily,
      fontSize: 13,
      fontWeight: FontWeight.w500,
      height: 1.4,
      color: AppColors.badgeText,
    );
  }

  // Badge Text - 11px semibold (Badge labels)
  static TextStyle badgeText({bool isDark = false}) {
    return TextStyle(
      fontFamily: _fontFamily,
      fontSize: 11,
      fontWeight: FontWeight.w600,
      height: 1.3,
      color: AppColors.badgeText,
    );
  }
}
