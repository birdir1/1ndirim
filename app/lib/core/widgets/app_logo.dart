import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_colors.dart';

/// 1ndirim Logo Widget
/// Özel logo fontu ile "1ndirim" text'i gösterir
class AppLogo extends StatelessWidget {
  final double? fontSize;
  final Color? textColor;
  final FontWeight? fontWeight;

  const AppLogo({
    super.key,
    this.fontSize,
    this.textColor,
    this.fontWeight,
  });

  @override
  Widget build(BuildContext context) {
    return Text(
      '1ndirim',
      style: GoogleFonts.poppins(
        fontSize: fontSize ?? 28,
        fontWeight: fontWeight ?? FontWeight.w800, // Çok kalın, logo gibi
        letterSpacing: -1.0, // Sıkı letter-spacing, logo hissi
        color: textColor ?? AppColors.textPrimaryLight,
        height: 1.0,
        // Logo gibi görünmesi için ekstra özellikler
        shadows: [
          Shadow(
            color: AppColors.textPrimaryLight.withOpacity(0.1),
            offset: const Offset(0, 1),
            blurRadius: 2,
          ),
        ],
      ),
    );
  }
}
