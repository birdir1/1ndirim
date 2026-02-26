import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/theme/brand_styles.dart';
import '../../../core/utils/page_transitions.dart';
import '../../../core/utils/source_logo_helper.dart';
import '../../../core/utils/network_result.dart';
import '../../../core/utils/tag_normalizer.dart';
import '../../../core/providers/compare_provider.dart';
import '../../../data/models/opportunity_model.dart';
import '../../../data/repositories/favorite_repository.dart';
import '../campaign_detail_screen.dart';
import '../../compare/compare_screen.dart';

/// Opportunity Card Widget V2
/// Görsel olarak tamamen yeniden tasarlandı - Logo'lar büyük ve net
/// Favori butonu eklendi
class OpportunityCardV2 extends StatefulWidget {
  final OpportunityModel opportunity;
  final bool? isFavorite; // Initial favorite state (optional)

  const OpportunityCardV2({
    super.key,
    required this.opportunity,
    this.isFavorite,
  });

  @override
  State<OpportunityCardV2> createState() => _OpportunityCardV2State();
}

class _OpportunityCardV2State extends State<OpportunityCardV2> {
  bool _isFavorite = false;
  bool _isLoading = false;
  final FavoriteRepository _favoriteRepository = FavoriteRepository.instance;
  FirebaseAuth? get _auth {
    try {
      return FirebaseAuth.instance;
    } catch (_) {
      return null;
    }
  }

  @override
  void initState() {
    super.initState();
    _isFavorite = widget.isFavorite ?? false;
    // Favorite state is expected to be prefetched by the parent (batch-check).
    // We intentionally avoid per-card network calls to prevent request storms/429s.
  }

  @override
  void didUpdateWidget(covariant OpportunityCardV2 oldWidget) {
    super.didUpdateWidget(oldWidget);
    // Parent may update the initial favorite state after batch-check completes.
    if (widget.isFavorite != null &&
        widget.isFavorite != oldWidget.isFavorite) {
      _isFavorite = widget.isFavorite!;
    }
  }

  Future<void> _toggleFavorite() async {
    // Kullanıcı giriş yapmamışsa işlem yapma
    if (_auth?.currentUser == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Favori eklemek için giriş yapmanız gerekiyor'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    if (_isLoading) return;

    setState(() {
      _isLoading = true;
    });

    try {
      if (_isFavorite) {
        // Favoriden çıkar
        final result = await _favoriteRepository.removeFavorite(
          widget.opportunity.id,
        );
        if (result is NetworkSuccess) {
          if (mounted) {
            setState(() {
              _isFavorite = false;
              _isLoading = false;
            });
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Favorilerden çıkarıldı'),
                duration: Duration(seconds: 1),
                backgroundColor: AppColors.success,
              ),
            );
          }
        } else if (result is NetworkError) {
          throw Exception(result.message);
        } else {
          throw Exception('Favoriden çıkarılamadı');
        }
      } else {
        // Favoriye ekle
        final result = await _favoriteRepository.addFavorite(
          widget.opportunity.id,
        );
        if (result is NetworkSuccess) {
          if (mounted) {
            setState(() {
              _isFavorite = true;
              _isLoading = false;
            });
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Favorilere eklendi'),
                duration: Duration(seconds: 1),
                backgroundColor: AppColors.success,
              ),
            );
          }
        } else if (result is NetworkError) {
          throw Exception(result.message);
        } else {
          throw Exception('Favoriye eklenemedi');
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceFirst('Exception: ', '')),
            backgroundColor: AppColors.error,
            duration: const Duration(seconds: 2),
          ),
        );
      }
    }
  }

  String _cleanText(String input) {
    var out = input.trim();
    out = out.replaceAll(
      RegExp(r'^0[0-9\.]*\s*TL[^A-Za-z0-9]?', caseSensitive: false),
      '',
    );
    out = out.replaceAll(
      RegExp(r'[_\-][0-9]{2,4}x[0-9]{2,4}', caseSensitive: false),
      ' ',
    );
    out = out.replaceAll(
      RegExp(r'\.(jpg|jpeg|png|gif|webp)(\?.*)?$', caseSensitive: false),
      '',
    );
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
    if (out.isNotEmpty) {
      out = out[0].toUpperCase() + out.substring(1);
    }
    return out;
  }

  String _pickBetterTitle(String rawTitle, String detail) {
    final title = _cleanText(rawTitle);
    final fallback = _cleanText(detail);
    final looksIncomplete = title.length < 25 || RegExp(r"\d$").hasMatch(title);
    if (looksIncomplete &&
        fallback.isNotEmpty &&
        fallback.length > title.length) {
      final firstLine = fallback
          .split(RegExp(r"[\.!?\n]"))
          .firstWhere((e) => e.trim().isNotEmpty, orElse: () => fallback);
      final normalized = _cleanText(firstLine);
      if (normalized.isNotEmpty) return normalized;
    }
    return title.isNotEmpty
        ? title
        : (fallback.isNotEmpty ? fallback : rawTitle);
  }

  @override
  Widget build(BuildContext context) {
    final brandStyle = BrandStyles.getStyle(widget.opportunity.sourceName);
    final sourceColor = brandStyle.primary;
    final sourceBg = brandStyle.background;
    final normalized = TagNormalizer.normalize(widget.opportunity.tags);
    final primaryTag = normalized.primary;
    final chipTags = <String>[]; // Tag'leri gösterme: backend filtreliyor
    final hidePrimaryChip =
        primaryTag == null ||
        primaryTag.toLowerCase() == 'banka' ||
        primaryTag.toLowerCase() == 'bankası' ||
        primaryTag.toLowerCase() == 'bankasi' ||
        primaryTag.toLowerCase() == 'operatör';
    final displayTitle = _pickBetterTitle(
      widget.opportunity.title,
      widget.opportunity.detailText ??
          widget.opportunity.description ??
          widget.opportunity.subtitle,
    );
    final semanticLabel = '$displayTitle • ${widget.opportunity.sourceName}'
        '${primaryTag != null ? ' • $primaryTag' : ''}';

    final card = Semantics(
      button: true,
      label: semanticLabel,
      child: InkWell(
        onTap: () {
          Navigator.of(context).push(
            SlidePageRoute(
              child: CampaignDetailScreen.fromOpportunity(
                opportunity: widget.opportunity,
                primaryTag: primaryTag,
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
              color: sourceColor.withValues(alpha: 0.25),
              width: 2,
            ),
            boxShadow: [
              BoxShadow(
                color: sourceColor.withValues(alpha: 0.15),
                blurRadius: 24,
                offset: const Offset(0, 8),
              ),
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.05),
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
                  color: sourceBg,
                  borderRadius: const BorderRadius.vertical(
                    top: Radius.circular(28),
                  ),
                  border: Border(
                    bottom: BorderSide(
                      color: sourceColor.withValues(alpha: 0.1),
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
                          color: sourceColor.withValues(alpha: 0.3),
                          width: 2,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: sourceColor.withValues(alpha: 0.2),
                            blurRadius: 12,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(14.0),
                        child: SourceLogoHelper.getLogoWidget(
                          widget.opportunity.sourceName,
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
                            widget.opportunity.sourceName,
                            style: AppTextStyles.cardTitle(isDark: false)
                                .copyWith(
                                  fontSize: 20,
                                  fontWeight: FontWeight.w700,
                                  color: sourceColor,
                                  letterSpacing: -0.5,
                                ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 4),
                          if (!hidePrimaryChip)
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 4,
                              ),
                              decoration: BoxDecoration(
                                color: sourceColor.withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                primaryTag,
                                style: AppTextStyles.small(isDark: false)
                                    .copyWith(
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
                    // Aksiyon Butonları
                    Row(
                      children: [
                        // Karşılaştırma Butonu
                        Consumer<CompareProvider>(
                          builder: (context, compareProvider, child) {
                            final isInCompare = compareProvider.contains(
                              widget.opportunity.id,
                            );
                            final isFull = compareProvider.isFull && !isInCompare;

                            return GestureDetector(
                              onTap: () {
                                if (isInCompare) {
                                  compareProvider.removeCampaign(
                                    widget.opportunity.id,
                                  );
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                      content: Text(
                                        'Karşılaştırmadan kaldırıldı',
                                      ),
                                      duration: Duration(seconds: 1),
                                    ),
                                  );
                                } else if (isFull) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      content: Text(
                                        'En fazla ${CompareProvider.maxCompareCount} kampanya karşılaştırabilirsiniz',
                                      ),
                                      duration: const Duration(seconds: 2),
                                      backgroundColor: AppColors.error,
                                    ),
                                  );
                                } else {
                                  final added = compareProvider.addCampaign(
                                    widget.opportunity,
                                  );
                                  if (added) {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(
                                        content: Text(
                                          '${compareProvider.count}/${CompareProvider.maxCompareCount} kampanya seçildi',
                                        ),
                                        duration: const Duration(seconds: 1),
                                        action: compareProvider.count >= 2
                                            ? SnackBarAction(
                                                label: 'Karşılaştır',
                                                textColor: Colors.white,
                                                onPressed: () {
                                                  Navigator.of(context).push(
                                                    SlidePageRoute(
                                                      child: CompareScreen(
                                                        campaigns: compareProvider
                                                            .campaigns,
                                                      ),
                                                      direction:
                                                          SlideDirection.up,
                                                    ),
                                                  );
                                                },
                                              )
                                            : null,
                                      ),
                                    );
                                  }
                                }
                              },
                              child: Container(
                                width: 40,
                                height: 40,
                                decoration: BoxDecoration(
                                  color: isInCompare
                                      ? AppColors.primaryLight.withValues(
                                          alpha: 0.1,
                                        )
                                      : Colors.white.withValues(alpha: 0.8),
                                  shape: BoxShape.circle,
                                  border: Border.all(
                                    color: isInCompare
                                        ? AppColors.primaryLight.withValues(
                                            alpha: 0.3,
                                          )
                                        : Colors.grey.withValues(alpha: 0.3),
                                    width: 1.5,
                                  ),
                                ),
                                child: Icon(
                                  Icons.compare_arrows,
                                  color: isInCompare
                                      ? AppColors.primaryLight
                                      : (isFull
                                            ? Colors.grey.withValues(alpha: 0.5)
                                            : Colors.grey),
                                  size: 20,
                                ),
                              ),
                            );
                          },
                        ),
                        const SizedBox(width: 8),
                        // Favori Butonu
                        if (_auth?.currentUser != null)
                          GestureDetector(
                            onTap: _toggleFavorite,
                            child: Container(
                              width: 40,
                              height: 40,
                              decoration: BoxDecoration(
                                color: _isFavorite
                                    ? AppColors.discountRed.withValues(alpha: 0.1)
                                    : Colors.white.withValues(alpha: 0.8),
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: _isFavorite
                                      ? AppColors.discountRed.withValues(
                                          alpha: 0.3,
                                        )
                                      : Colors.grey.withValues(alpha: 0.3),
                                  width: 1.5,
                                ),
                              ),
                              child: _isLoading
                                  ? const Padding(
                                      padding: EdgeInsets.all(10.0),
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                        valueColor: AlwaysStoppedAnimation<Color>(
                                          AppColors.discountRed,
                                        ),
                                      ),
                                    )
                                  : Icon(
                                      _isFavorite
                                          ? Icons.favorite
                                          : Icons.favorite_border,
                                      color: _isFavorite
                                          ? AppColors.discountRed
                                          : Colors.grey,
                                      size: 20,
                                    ),
                            ),
                          ),
                      ],
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
                      displayTitle,
                      style: AppTextStyles.cardTitle(isDark: false).copyWith(
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        letterSpacing: -0.5,
                        height: 1.3,
                        color: sourceColor,
                      ),
                      maxLines: 3,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 12),

                    // Subtitle - Eğer anlamsız veya çok kısaysa tags'den göster
                    Builder(
                      builder: (context) {
                        final cleanedTitle = _cleanText(widget.opportunity.title);
                        String displayText = _cleanText(
                          widget.opportunity.detailText ??
                              widget.opportunity.description ??
                              widget.opportunity.subtitle,
                        );

                        // Eğer subtitle başlıkla aynı/benzerse gösterme
                        if (displayText.isNotEmpty &&
                            cleanedTitle.isNotEmpty &&
                            displayText.toLowerCase() ==
                                cleanedTitle.toLowerCase()) {
                          displayText = '';
                        }

                        // "detaylar" tek başına ise gösterme
                        if (RegExp(
                          r'^detaylar?$',
                          caseSensitive: false,
                        ).hasMatch(displayText)) {
                          displayText = '';
                        }

                        // Kaynak adıyla aynı veya çok kısa ise gösterme
                        if (displayText.isNotEmpty &&
                            (displayText.toLowerCase() ==
                                    widget.opportunity.sourceName.toLowerCase() ||
                                displayText.length < 8)) {
                          displayText = '';
                        }

                        // Eğer subtitle boş, çok kısa veya anlamsızsa tags'den al
                        if (displayText.isEmpty ||
                            displayText.length < 10 ||
                            displayText.toUpperCase() ==
                                displayText || // Tamamı büyük harf
                            displayText.contains(RegExp(r'^[A-Z0-9]+$'))) {
                          // Sadece büyük harf ve rakam
                          // Tags'den anlamlı bir açıklama bul
                          if (chipTags.isNotEmpty) {
                            displayText = chipTags
                                .where((tag) => tag.length > 6)
                                .take(2)
                                .join(' • ');
                          }
                        }

                        if (displayText.isEmpty) return const SizedBox.shrink();

                        return Text(
                          displayText,
                          style: AppTextStyles.cardSubtitle(isDark: false)
                              .copyWith(
                                fontSize: 15,
                                height: 1.5,
                                color: const Color(0xFF4A4A4A),
                              ),
                          maxLines: 3,
                          overflow: TextOverflow.ellipsis,
                        );
                      },
                    ),

                    const SizedBox(height: 16),

                    // Tags - Daha Büyük ve Görsel
                    if (chipTags.isNotEmpty)
                      Wrap(
                        spacing: 10,
                        runSpacing: 10,
                        children: chipTags.map((tag) {
                          final isDiscount =
                              tag.toLowerCase().contains('%') ||
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
                                    ? AppColors.badgeDiscountText.withValues(
                                        alpha: 0.3,
                                      )
                                    : AppColors.badgeText.withValues(alpha: 0.3),
                                width: 1.5,
                              ),
                            ),
                            child: Text(
                              tag,
                              style: AppTextStyles.badgeText(isDark: false)
                                  .copyWith(
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
      ),
    );

    return LayoutBuilder(
      builder: (context, constraints) {
        if (constraints.hasBoundedHeight && constraints.maxHeight < 200) {
          final width = constraints.maxWidth.isFinite
              ? constraints.maxWidth
              : 280.0;
          return FittedBox(
            fit: BoxFit.scaleDown,
            alignment: Alignment.topLeft,
            child: SizedBox(
              width: width,
              child: card,
            ),
          );
        }
        return card;
      },
    );
  }
}
