import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/source_logo_helper.dart';
import '../../../data/models/opportunity_model.dart';

/// Curated Campaign Card Widget
/// Clean, informational card for discovery list
class CuratedCampaignCard extends StatelessWidget {
  final OpportunityModel campaign;
  final VoidCallback onTap;

  const CuratedCampaignCard({
    super.key,
    required this.campaign,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final sourceColor = SourceLogoHelper.getLogoBackgroundColor(
      campaign.sourceName,
    );
    final semanticsLabel = [
      campaign.title,
      if (campaign.isFree == true) 'Ücretsiz',
      if (campaign.discountPercentage != null)
        '%${campaign.discountPercentage!.round()} indirim',
      if (campaign.sourceName.isNotEmpty) campaign.sourceName,
    ].where((e) => e != null && e.toString().isNotEmpty).join(' • ');

    // Get meaningful subtitle
    String displaySubtitle = campaign.subtitle;
    if (displaySubtitle.isEmpty ||
        displaySubtitle.length < 10 ||
        displaySubtitle.toUpperCase() == displaySubtitle ||
        displaySubtitle.contains(RegExp(r'^[A-Z0-9]+$'))) {
      if (campaign.tags.isNotEmpty) {
        displaySubtitle = campaign.tags
            .where((tag) => tag.length > 10)
            .take(2)
            .join(' • ');
      }
    }

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Semantics(
        button: true,
        label: semanticsLabel,
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: onTap,
            borderRadius: BorderRadius.circular(16),
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.divider, width: 1),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.shadowDark.withValues(alpha: 0.04),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Row(
                children: [
                  // Brand Icon
                  Container(
                    width: 56,
                    height: 56,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                        color: sourceColor.withValues(alpha: 0.25),
                        width: 2,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: sourceColor.withValues(alpha: 0.1),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(10.0),
                      child: SourceLogoHelper.getLogoWidget(
                        campaign.sourceName,
                        width: 36,
                        height: 36,
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),

                  // Content
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Wrap(
                          spacing: 6,
                          runSpacing: 6,
                          children: [
                            if (campaign.sponsored == true)
                              _buildBadge('Sponsorlu', AppColors.warning),
                            if (campaign.isFree == true) ...[
                              _buildBadge('Ücretsiz', AppColors.success),
                            ] else if (campaign.discountPercentage != null) ...[
                              _buildBadge(
                                '%${campaign.discountPercentage!.round()}',
                                AppColors.discountRed,
                              ),
                            ],
                            if (campaign.platform != null &&
                                campaign.platform!.isNotEmpty)
                              _buildBadge(
                                campaign.platform!,
                                AppColors.textSecondaryLight,
                              ),
                            if (campaign.endAt != null)
                              _buildBadge(
                                _expiryLabel(campaign.endAt!),
                                AppColors.warning,
                              ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        // Campaign Title
                        Text(
                          campaign.title,
                          style: AppTextStyles.body(isDark: false).copyWith(
                            fontWeight: FontWeight.w600,
                            fontSize: 15,
                            height: 1.3,
                            color: AppColors.textPrimaryLight,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 6),

                        // Benefit Description
                        if (displaySubtitle.isNotEmpty)
                          Text(
                            displaySubtitle,
                            style: AppTextStyles.caption(isDark: false)
                                .copyWith(
                                  color: AppColors.textSecondaryLight,
                                  fontSize: 13,
                                  height: 1.4,
                                ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        const SizedBox(height: 8),

                        // Source/Provider Line
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 4,
                              ),
                              decoration: BoxDecoration(
                                color: sourceColor.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                campaign.sourceName,
                                style: AppTextStyles.caption(isDark: false)
                                    .copyWith(
                                      color: sourceColor,
                                      fontSize: 11,
                                      fontWeight: FontWeight.w600,
                                    ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(width: 12),

                  // Arrow
                  Icon(
                    Icons.arrow_forward_ios,
                    size: 16,
                    color: AppColors.iconSecondary,
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildBadge(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withValues(alpha: 0.25)),
      ),
      child: Text(
        text,
        style: AppTextStyles.caption(isDark: false).copyWith(
          color: color,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }

  String _expiryLabel(String iso) {
    try {
      final dt = DateTime.parse(iso);
      final diff = dt.difference(DateTime.now());
      if (diff.inDays >= 2) return 'Bitiyor: ${diff.inDays}g';
      if (diff.inHours >= 1) return 'Bitiyor: ${diff.inHours}s';
      if (diff.inMinutes > 0) return 'Bitiyor: ${diff.inMinutes}dk';
      return 'Bitiyor';
    } catch (_) {
      return 'Bitiyor';
    }
  }
}
