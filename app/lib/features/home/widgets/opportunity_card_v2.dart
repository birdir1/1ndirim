import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/page_transitions.dart';
import '../../../core/utils/source_logo_helper.dart';
import '../../../data/models/opportunity_model.dart';
import '../campaign_detail_screen.dart';

/// Opportunity Card Widget V2
/// Görsel olarak tamamen yeniden tasarlandı - Logo'lar büyük ve net
class OpportunityCardV2 extends StatelessWidget {
  final OpportunityModel opportunity;

  const OpportunityCardV2({
    super.key,
    required this.opportunity,
  });

  @override
  Widget build(BuildContext context) {
    final sourceColor = SourceLogoHelper.getLogoBackgroundColor(opportunity.sourceName);
    
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
      borderRadius: BorderRadius.circular(28),
      child: Container(
        margin: const EdgeInsets.only(bottom: 20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(28),
          border: Border.all(
            color: sourceColor.withOpacity(0.25),
            width: 2,
          ),
          boxShadow: [
            BoxShadow(
              color: sourceColor.withOpacity(0.15),
              blurRadius: 24,
              offset: const Offset(0, 8),
            ),
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header: Logo + Source Name (Büyük ve Net)
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: sourceColor.withOpacity(0.05),
                borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
                border: Border(
                  bottom: BorderSide(
                    color: sourceColor.withOpacity(0.1),
                    width: 1,
                  ),
                ),
              ),
              child: Row(
                children: [
                  // Source Logo - ÇOK DAHA BÜYÜK VE NET
                  Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: sourceColor.withOpacity(0.3),
                        width: 2.5,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: sourceColor.withOpacity(0.2),
                          blurRadius: 12,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(14.0),
                      child: SourceLogoHelper.getLogoWidget(
                        opportunity.sourceName,
                        width: 52,
                        height: 52,
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  // Source Name - Büyük ve Belirgin
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          opportunity.sourceName,
                          style: AppTextStyles.cardTitle(isDark: false).copyWith(
                            fontSize: 20,
                            fontWeight: FontWeight.w700,
                            color: sourceColor,
                            letterSpacing: -0.5,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 4),
                        if (opportunity.tags.isNotEmpty)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: sourceColor.withOpacity(0.15),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              opportunity.tags.first,
                              style: AppTextStyles.small(isDark: false).copyWith(
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                                color: sourceColor,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            
            // Content
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title - Çok Büyük ve Belirgin
                  Text(
                    opportunity.title,
                    style: AppTextStyles.cardTitle(isDark: false).copyWith(
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                      letterSpacing: -0.5,
                      height: 1.3,
                      color: opportunity.title.contains('%') || 
                             opportunity.title.toLowerCase().contains('indirim')
                          ? AppColors.discountRed
                          : AppColors.textPrimaryLight,
                    ),
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 12),
                  
                  // Subtitle
                  if (opportunity.subtitle.isNotEmpty)
                    Text(
                      opportunity.subtitle,
                      style: AppTextStyles.cardSubtitle(isDark: false).copyWith(
                        fontSize: 15,
                        height: 1.5,
                        color: AppColors.textSecondaryLight,
                      ),
                      maxLines: 3,
                      overflow: TextOverflow.ellipsis,
                    ),
                  
                  const SizedBox(height: 16),
                  
                  // Tags - Daha Büyük ve Görsel
                  if (opportunity.tags.length > 1)
                    Wrap(
                      spacing: 10,
                      runSpacing: 10,
                      children: opportunity.tags.skip(1).take(3).map((tag) {
                        final isDiscount = tag.toLowerCase().contains('%') || 
                                         tag.toLowerCase().contains('indirim') ||
                                         tag.toLowerCase().contains('son');
                        return Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 14,
                            vertical: 8,
                          ),
                          decoration: BoxDecoration(
                            color: isDiscount 
                                ? AppColors.badgeDiscountBackground 
                                : AppColors.badgeBackground,
                            borderRadius: BorderRadius.circular(22),
                            border: Border.all(
                              color: isDiscount 
                                  ? AppColors.badgeDiscountText.withOpacity(0.3)
                                  : AppColors.badgeText.withOpacity(0.3),
                              width: 1.5,
                            ),
                          ),
                          child: Text(
                            tag,
                            style: AppTextStyles.badgeText(isDark: false).copyWith(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: isDiscount 
                                  ? AppColors.badgeDiscountText 
                                  : AppColors.badgeText,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        );
                      }).toList(),
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
