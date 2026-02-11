import 'package:flutter/material.dart';
import 'app_colors.dart';

/// Shared UI sizing and surface tokens for visual consistency.
class AppUiTokens {
  static const double screenPadding = 24;
  static const double sectionGap = 16;
  static const double itemGap = 16;
  static const double cardRadius = 20;
  static const double chipRadius = 14;

  static BoxDecoration elevatedSurface({Color? color}) {
    return BoxDecoration(
      color: color ?? AppColors.cardBackground,
      borderRadius: BorderRadius.circular(cardRadius),
      boxShadow: const [
        BoxShadow(
          color: AppColors.shadowDark,
          blurRadius: 20,
          offset: Offset(0, 8),
        ),
      ],
      border: Border.all(color: AppColors.dividerLight, width: 1),
    );
  }
}
