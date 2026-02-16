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

  String _clean(String input) {
    var out = input.trim();
    out = out.replaceAll(RegExp(r'^0[0-9\.]*\s*TL[^A-Za-z0-9]?', caseSensitive: false), '');
    out = out.replaceAll(RegExp(r'[_\-][0-9]{2,4}x[0-9]{2,4}', caseSensitive: false), ' ');
    out = out.replaceAll(RegExp(r'\.(jpg|jpeg|png|gif|webp)(\?.*)?$', caseSensitive: false), '');
    out = out.replaceAll(RegExp(r'[\-_]+'), ' ');

    final dropPatterns = [
      RegExp(r'https?://', caseSensitive: false),
      RegExp(r'[a-z0-9]+_[a-z0-9]+', caseSensitive: false),
      RegExp(r'\.com\b', caseSensitive: false),
      RegExp(r'function\s*\(\)', caseSensitive: false),
      RegExp(r'window\.', caseSensitive: false),
      RegExp(r'<script', caseSensitive: false),
    ];
    if (dropPatterns.any((p) => p.hasMatch(out))) return '';

    final noisePatterns = [
      RegExp(r'çerez', caseSensitive: false),
      RegExp(r'kampanya bulunam', caseSensitive: false),
      RegExp(r'sitemizden en iyi şekilde faydalan', caseSensitive: false),
      RegExp(r'©', caseSensitive: false),
      RegExp(r'vakıfbank', caseSensitive: false),
      RegExp(r'vakifbank', caseSensitive: false),
      RegExp(r'kisisel verilerin', caseSensitive: false),
      RegExp(r'kvkk', caseSensitive: false),
    ];
    if (noisePatterns.any((p) => p.hasMatch(out))) return '';

    out = out.replaceAll(RegExp(r'\s+'), ' ').trim();
    return out;
  }

  String _pickBetterTitle(String rawTitle, String detail) {
    final title = _clean(rawTitle);
    final fallback = _clean(detail);
    final looksIncomplete = title.length < 25 || RegExp(r'\\d$').hasMatch(title);
    if (looksIncomplete && fallback.isNotEmpty && fallback.length > title.length) {
      final firstLine = fallback.split(RegExp(r'[\\.!?\\n]')).firstWhere(
        (e) => e.trim().isNotEmpty,
        orElse: () => fallback,
      );
      final normalized = firstLine.trim();
      if (normalized.isNotEmpty) return normalized;
    }
    return title.isNotEmpty ? title : (fallback.isNotEmpty ? fallback : rawTitle);
  }

  @override
  Widget build(BuildContext context) {
    final normalized = TagNormalizer.normalize(opportunity.tags);
    final subtitleRaw = opportunity.detailText ?? opportunity.description;
    final subtitle = _clean(subtitleRaw ?? opportunity.subtitle);
    final title = _pickBetterTitle(opportunity.title, subtitleRaw ?? opportunity.subtitle);
    final shouldShowSubtitle = subtitle.isNotEmpty &&
        subtitle.toLowerCase() != title.toLowerCase() &&
        subtitle.toLowerCase() != opportunity.sourceName.toLowerCase() &&
        subtitle.length >= 8 &&
        !RegExp(r'^detaylar?$', caseSensitive: false).hasMatch(subtitle);

    return Semantics(
      button: true,
      label: '$title • ${opportunity.sourceName}'
          '${normalized.primary != null ? ' • ${normalized.primary}' : ''}',
      child: InkWell(
        onTap: () {
          Navigator.of(context).push(
            SlidePageRoute(
              child: CampaignDetailScreen.fromOpportunity(
                opportunity: opportunity,
                primaryTag: normalized.primary,
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
                    title,
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
                  if (shouldShowSubtitle)
                    Text(
                      subtitle,
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
