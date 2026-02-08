import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/page_transitions.dart';
import '../../../core/utils/source_logo_helper.dart';
import '../../../core/utils/tag_normalizer.dart';
import '../../../data/models/opportunity_model.dart';
import '../campaign_detail_screen.dart';

/// Opportunity Card Widget
class OpportunityCard extends StatelessWidget {
  final OpportunityModel opportunity; // YENİ: Tüm opportunity objesi

  const OpportunityCard({
    super.key,
    required this.opportunity,
  });

  @override
  Widget build(BuildContext context) {
    final normalized = TagNormalizer.normalize(opportunity.tags);
    return InkWell(
      onTap: () {
        Navigator.of(context).push(
          SlidePageRoute(
            child: CampaignDetailScreen(
              title: opportunity.title,
              description: opportunity.subtitle,
              detailText: 'Bu kampanyayı kullanmak için ilgili kartınızla alışveriş yapmanız yeterli.',
              logoColor: opportunity.iconColor,
              sourceName: opportunity.sourceName,
              primaryTag: normalized.primary,
              affiliateUrl: opportunity.affiliateUrl,
              campaignId: opportunity.id,
              originalUrl: opportunity.originalUrl ?? '',
            ),
            direction: SlideDirection.right,
          ),
        );
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: AppColors.cardBackground,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(
            color: SourceLogoHelper.getLogoBackgroundColor(opportunity.sourceName).withValues(alpha: 0.2),
            width: 1.5,
          ),
          boxShadow: [
            BoxShadow(
              color: SourceLogoHelper.getLogoBackgroundColor(opportunity.sourceName).withValues(alpha: 0.08),
              blurRadius: 20,
              offset: const Offset(0, 6),
            ),
            BoxShadow(
              color: AppColors.shadowDark.withValues(alpha: 0.05),
              blurRadius: 10,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Source Logo Box - Daha büyük ve net
            Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: SourceLogoHelper.getLogoBackgroundColor(opportunity.sourceName).withValues(alpha: 0.3),
                  width: 2,
                ),
                boxShadow: [
                  BoxShadow(
                    color: SourceLogoHelper.getLogoBackgroundColor(opportunity.sourceName).withValues(alpha: 0.1),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Padding(
                padding: const EdgeInsets.all(12.0),
                child: SourceLogoHelper.getLogoWidget(
                  opportunity.sourceName,
                  width: 48,
                  height: 48,
                ),
              ),
            ),
            const SizedBox(width: 16),
            // Content
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title - Daha büyük ve belirgin
                  Text(
                    opportunity.title,
                    style: AppTextStyles.cardTitle(isDark: false).copyWith(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      letterSpacing: -0.3,
                      // İndirim yüzdesi varsa kan kırmızısı
                      color: opportunity.title.contains('%') || opportunity.title.toLowerCase().contains('indirim')
                          ? AppColors.discountRed
                          : AppColors.textPrimaryLight,
                      height: 1.3,
                    ),
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 8),
                  // Subtitle - Daha okunabilir
                  if (opportunity.subtitle.isNotEmpty)
                    Text(
                      opportunity.subtitle,
                      style: AppTextStyles.cardSubtitle(isDark: false).copyWith(
                        fontSize: 14,
                        height: 1.5,
                        color: AppColors.textSecondaryLight,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  const SizedBox(height: 12),
                  // Source name - Daha belirgin
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          color: SourceLogoHelper.getLogoBackgroundColor(opportunity.sourceName).withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                            color: SourceLogoHelper.getLogoBackgroundColor(opportunity.sourceName).withValues(alpha: 0.3),
                            width: 1,
                          ),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            SizedBox(
                              width: 20,
                              height: 20,
                              child: SourceLogoHelper.getLogoWidget(
                                opportunity.sourceName,
                                width: 20,
                                height: 20,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              opportunity.sourceName,
                              style: AppTextStyles.small(isDark: false).copyWith(
                                color: SourceLogoHelper.getLogoBackgroundColor(opportunity.sourceName),
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  // Tags - İndirim içerenler kan kırmızısı
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: opportunity.tags
                        .map((tag) {
                          final isDiscount = tag.toLowerCase().contains('%') || 
                                           tag.toLowerCase().contains('indirim') ||
                                           tag.toLowerCase().contains('son');
                          return RepaintBoundary(
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 4,
                              ),
                              decoration: BoxDecoration(
                                color: isDiscount 
                                    ? AppColors.badgeDiscountBackground 
                                    : AppColors.badgeBackground,
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: Text(
                                tag,
                                style: AppTextStyles.badgeText(isDark: false).copyWith(
                                  color: isDiscount 
                                      ? AppColors.badgeDiscountText 
                                      : AppColors.badgeText,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          );
                        })
                        .toList(),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
