import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/page_transitions.dart';
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
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.cardBackground,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: AppColors.shadowDark,
              blurRadius: 12,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Icon Box
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: opportunity.iconBgColor,
                shape: BoxShape.circle,
              ),
              child: Icon(
                opportunity.icon,
                size: 24,
                color: opportunity.iconColor,
              ),
            ),
            const SizedBox(width: 12),
            // Content
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    opportunity.title,
                    style: AppTextStyles.cardTitle(isDark: false).copyWith(
                      // İndirim yüzdesi varsa kan kırmızısı
                      color: opportunity.title.contains('%') || opportunity.title.toLowerCase().contains('indirim')
                          ? AppColors.discountRed
                          : AppColors.textPrimaryLight,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 3),
                  Text(
                    opportunity.subtitle,
                    style: AppTextStyles.cardSubtitle(isDark: false),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  // Source reference
                  Row(
                    children: [
                      Icon(
                        Icons.business_outlined,
                        size: 12,
                        color: AppColors.textSecondaryLight,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        opportunity.sourceName,
                        style: AppTextStyles.small(isDark: false).copyWith(
                          color: AppColors.textSecondaryLight,
                          fontSize: 11,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
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
