import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_text_styles.dart';
import '../theme/app_ui_tokens.dart';

/// Shared page scaffold with consistent app bar and spacing.
class ScreenShell extends StatelessWidget {
  final String title;
  final Widget child;
  final List<Widget>? actions;
  final bool centerTitle;
  final EdgeInsetsGeometry? padding;

  const ScreenShell({
    super.key,
    required this.title,
    required this.child,
    this.actions,
    this.centerTitle = false,
    this.padding,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      appBar: AppBar(
        backgroundColor: AppColors.backgroundLight,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.textPrimaryLight),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text(title, style: AppTextStyles.pageTitle(isDark: false)),
        centerTitle: centerTitle,
        actions: actions,
      ),
      body: SafeArea(
        child: Padding(
          padding:
              padding ??
              const EdgeInsets.symmetric(horizontal: AppUiTokens.screenPadding),
          child: child,
        ),
      ),
    );
  }
}
