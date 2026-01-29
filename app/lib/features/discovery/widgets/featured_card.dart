import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/source_logo_helper.dart';
import '../../../data/models/opportunity_model.dart';

/// Featured Card Widget
/// Large premium card for editor's pick
class FeaturedCard extends StatelessWidget {
  final OpportunityModel campaign;
  final VoidCallback onTap;

  const FeaturedCard({super.key, required this.campaign, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final sourceColor = SourceLogoHelper.getLogoBackgroundColor(
      campaign.sourceName,
    );

    // Extract discount percentage from title if available
    String? discountText;
    final titleLower = campaign.title.toLowerCase();
    if (titleLower.contains('%')) {
      final match = RegExp(r'%(\d+)').firstMatch(campaign.title);
      if (match != null) {
        discountText = '%${match.group(1)}';
      } else {
        final match2 = RegExp(r'(\d+)%').firstMatch(campaign.title);
        if (match2 != null) {
          discountText = '%${match2.group(1)}';
        }
      }
    }

    // Check if it's a cashback campaign
    final isCashback =
        titleLower.contains('cashback') ||
        campaign.subtitle.toLowerCase().contains('cashback');

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Container(
          height: 200,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [const Color(0xFF1A1A1A), const Color(0xFF2D2D2D)],
            ),
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: AppColors.shadowDark.withValues(alpha: 0.2),
                blurRadius: 20,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Stack(
            children: [
              // Background pattern (subtle)
              Positioned.fill(
                child: Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(20),
                    gradient: LinearGradient(
                      begin: Alignment.topRight,
                      end: Alignment.bottomLeft,
                      colors: [
                        sourceColor.withValues(alpha: 0.1),
                        Colors.transparent,
                      ],
                    ),
                  ),
                ),
              ),

              // Content
              Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Header: Badge + Logo
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        // Badge
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: AppColors.primaryLight,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            'ÖZEL FIRSAT',
                            style: AppTextStyles.badgeText(isDark: false)
                                .copyWith(
                                  color: Colors.white,
                                  fontSize: 10,
                                  letterSpacing: 0.5,
                                ),
                          ),
                        ),
                        // Logo
                        Container(
                          width: 48,
                          height: 48,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: sourceColor.withValues(alpha: 0.3),
                              width: 2,
                            ),
                          ),
                          child: Padding(
                            padding: const EdgeInsets.all(8.0),
                            child: SourceLogoHelper.getLogoWidget(
                              campaign.sourceName,
                              width: 32,
                              height: 32,
                            ),
                          ),
                        ),
                      ],
                    ),

                    const Spacer(),

                    // Main Value Statement
                    if (discountText != null || isCashback)
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            discountText ?? '%50',
                            style: AppTextStyles.headline(isDark: true)
                                .copyWith(
                                  fontSize: 48,
                                  fontWeight: FontWeight.w900,
                                  color: Colors.white,
                                  height: 1,
                                ),
                          ),
                          const SizedBox(width: 8),
                          Padding(
                            padding: const EdgeInsets.only(bottom: 8),
                            child: Text(
                              isCashback ? 'Cashback' : 'İndirim',
                              style: AppTextStyles.body(isDark: true).copyWith(
                                color: Colors.white.withValues(alpha: 0.9),
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ],
                      )
                    else
                      Text(
                        campaign.title,
                        style: AppTextStyles.title(isDark: true).copyWith(
                          color: Colors.white,
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),

                    const SizedBox(height: 8),

                    // Subtitle
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            campaign.sourceName,
                            style: AppTextStyles.caption(isDark: true).copyWith(
                              color: Colors.white.withValues(alpha: 0.7),
                              fontSize: 13,
                            ),
                          ),
                        ),
                        // CTA Button
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 8,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                'İncele',
                                style: AppTextStyles.caption(isDark: false)
                                    .copyWith(
                                      color: AppColors.textPrimaryLight,
                                      fontWeight: FontWeight.w600,
                                      fontSize: 13,
                                    ),
                              ),
                              const SizedBox(width: 4),
                              Icon(
                                Icons.arrow_forward,
                                size: 14,
                                color: AppColors.textPrimaryLight,
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
