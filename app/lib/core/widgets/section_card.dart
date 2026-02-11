import 'package:flutter/material.dart';
import '../theme/app_ui_tokens.dart';

/// Shared card container to keep section visuals consistent.
class SectionCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;

  const SectionCard({
    super.key,
    required this.child,
    this.padding,
    this.margin,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: margin,
      padding: padding ?? const EdgeInsets.all(16),
      decoration: AppUiTokens.elevatedSurface(),
      child: child,
    );
  }
}
