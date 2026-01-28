import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/page_transitions.dart';
import '../../../core/utils/source_logo_helper.dart';
import '../../../data/models/opportunity_model.dart';
import '../campaign_detail_screen.dart';

/// Enhanced Opportunity Card Widget
/// Görsel olarak iyileştirilmiş kampanya kartı
class OpportunityCardEnhanced extends StatelessWidget {
  final OpportunityModel opportunity;
  final String? imageUrl; // Kampanya görseli URL'i (backend'den gelecek)

  const OpportunityCardEnhanced({
    super.key,
    required this.opportunity,
    this.imageUrl,
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
      borderRadius: BorderRadius.circular(24),
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        decoration: BoxDecoration(
          color: AppColors.cardBackground,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(
            color: SourceLogoHelper.getLogoBackgroundColor(opportunity.sourceName).withValues(alpha: 0.15),
            width: 1.5,
          ),
          boxShadow: [
            BoxShadow(
              color: AppColors.shadowDark.withValues(alpha: 0.1),
              blurRadius: 20,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header: Logo + Source Name
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  // Source Logo
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: SourceLogoHelper.getLogoBackgroundColor(opportunity.sourceName).withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: SourceLogoHelper.getLogoBackgroundColor(opportunity.sourceName).withValues(alpha: 0.2),
                        width: 1,
                      ),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(10.0),
                      child: SourceLogoHelper.getLogoWidget(
                        opportunity.sourceName,
                        width: 28,
                        height: 28,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  // Source Name
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          opportunity.sourceName,
                          style: AppTextStyles.cardSubtitle(isDark: false).copyWith(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: SourceLogoHelper.getLogoBackgroundColor(opportunity.sourceName),
                          ),
                        ),
                        if (opportunity.tags.isNotEmpty)
                          Text(
                            opportunity.tags.first,
                            style: AppTextStyles.small(isDark: false).copyWith(
                              fontSize: 11,
                              color: AppColors.textSecondaryLight,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            
            // Campaign Image (if available)
            if (imageUrl != null && imageUrl!.isNotEmpty)
              ClipRRect(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                child: CachedNetworkImage(
                  imageUrl: imageUrl!,
                  width: double.infinity,
                  height: 180,
                  fit: BoxFit.cover,
                  placeholder: (context, url) => Container(
                    height: 180,
                    color: AppColors.surfaceLight,
                    child: const Center(
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: AppColors.primaryLight,
                      ),
                    ),
                  ),
                  errorWidget: (context, url, error) => Container(
                    height: 180,
                    color: AppColors.surfaceLight,
                    child: Icon(
                      Icons.image_not_supported,
                      color: AppColors.textSecondaryLight,
                      size: 48,
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
                  // Title
                  Text(
                    opportunity.title,
                    style: AppTextStyles.cardTitle(isDark: false).copyWith(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      height: 1.3,
                      color: opportunity.title.contains('%') || 
                             opportunity.title.toLowerCase().contains('indirim')
                          ? AppColors.discountRed
                          : AppColors.textPrimaryLight,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 8),
                  
                  // Subtitle
                  if (opportunity.subtitle.isNotEmpty)
                    Text(
                      opportunity.subtitle,
                      style: AppTextStyles.cardSubtitle(isDark: false).copyWith(
                        fontSize: 14,
                        height: 1.4,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  
                  const SizedBox(height: 14),
                  
                  // Tags
                  if (opportunity.tags.isNotEmpty)
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: opportunity.tags
                          .map((tag) {
                            final isDiscount = tag.toLowerCase().contains('%') || 
                                             tag.toLowerCase().contains('indirim') ||
                                             tag.toLowerCase().contains('son');
                            return Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 6,
                              ),
                              decoration: BoxDecoration(
                                color: isDiscount 
                                    ? AppColors.badgeDiscountBackground 
                                    : AppColors.badgeBackground,
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(
                                  color: isDiscount 
                                      ? AppColors.badgeDiscountText.withValues(alpha: 0.2)
                                      : AppColors.badgeText.withValues(alpha: 0.2),
                                  width: 1,
                                ),
                              ),
                              child: Text(
                                tag,
                                style: AppTextStyles.badgeText(isDark: false).copyWith(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w500,
                                  color: isDiscount 
                                      ? AppColors.badgeDiscountText 
                                      : AppColors.badgeText,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
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
