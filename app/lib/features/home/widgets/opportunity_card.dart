import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/page_transitions.dart';
import '../../../core/utils/source_logo_helper.dart';
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
    return InkWell(
      onTap: () {
        Navigator.of(context).push(
          SlidePageRoute(
            child: CampaignDetailScreen(
              title: opportunity.title,
              description: opportunity.subtitle,
              detailText: 'Bu kampanyayı kullanmak için ilgili kartınızla alışveriş yapmanız yeterli.',
              logoColor: opportunity.iconColor,
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
            color: SourceLogoHelper.getLogoBackgroundColor(opportunity.sourceName).withOpacity(0.1),
            width: 1,
          ),
          boxShadow: [
            BoxShadow(
              color: AppColors.shadowDark.withOpacity(0.08),
              blurRadius: 16,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Source Logo Box
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: SourceLogoHelper.getLogoBackgroundColor(opportunity.sourceName).withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: SourceLogoHelper.getLogoBackgroundColor(opportunity.sourceName).withOpacity(0.2),
                  width: 1,
                ),
              ),
              child: Padding(
                padding: const EdgeInsets.all(8.0),
                child: SourceLogoHelper.getLogoWidget(
                  opportunity.sourceName,
                  width: 40,
                  height: 40,
                ),
              ),
            ),
            const SizedBox(width: 16),
            // Content
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    opportunity.title,
                    style: AppTextStyles.cardTitle(isDark: false).copyWith(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      // İndirim yüzdesi varsa kan kırmızısı
                      color: opportunity.title.contains('%') || opportunity.title.toLowerCase().contains('indirim')
                          ? AppColors.discountRed
                          : AppColors.textPrimaryLight,
                      height: 1.3,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 6),
                  Text(
                    opportunity.subtitle,
                    style: AppTextStyles.cardSubtitle(isDark: false).copyWith(
                      fontSize: 13,
                      height: 1.4,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 10),
                  // Source reference with logo
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: SourceLogoHelper.getLogoBackgroundColor(opportunity.sourceName).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        SizedBox(
                          width: 16,
                          height: 16,
                          child: SourceLogoHelper.getLogoWidget(
                            opportunity.sourceName,
                            width: 16,
                            height: 16,
                          ),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          opportunity.sourceName,
                          style: AppTextStyles.small(isDark: false).copyWith(
                            color: SourceLogoHelper.getLogoBackgroundColor(opportunity.sourceName),
                            fontSize: 11,
                            fontWeight: FontWeight.w500,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),
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
