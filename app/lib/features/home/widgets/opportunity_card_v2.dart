import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/page_transitions.dart';
import '../../../core/utils/source_logo_helper.dart';
import '../../../core/utils/network_result.dart';
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
  final FirebaseAuth _auth = FirebaseAuth.instance;

  @override
  void initState() {
    super.initState();
    _isFavorite = widget.isFavorite ?? false;
    // Kullanıcı giriş yapmışsa favori durumunu kontrol et
    if (_auth.currentUser != null && widget.isFavorite == null) {
      _checkFavoriteStatus();
    }
  }

  Future<void> _checkFavoriteStatus() async {
    try {
      final isFav = await _favoriteRepository.isFavorite(widget.opportunity.id);
      if (mounted) {
        setState(() {
          _isFavorite = isFav;
        });
      }
    } catch (e) {
      // Silent fail - favori durumu kontrol edilemezse varsayılan olarak false
    }
  }

  Future<void> _toggleFavorite() async {
    // Kullanıcı giriş yapmamışsa işlem yapma
    if (_auth.currentUser == null) {
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

  @override
  Widget build(BuildContext context) {
    final sourceColor = SourceLogoHelper.getLogoBackgroundColor(
      widget.opportunity.sourceName,
    );

    return InkWell(
      onTap: () {
        Navigator.of(context).push(
          SlidePageRoute(
            child: CampaignDetailScreen.fromOpportunity(
              opportunity: widget.opportunity,
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
                color: sourceColor.withValues(alpha: 0.05),
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
                        width: 2.5,
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
                        if (widget.opportunity.tags.isNotEmpty)
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
                              widget.opportunity.tags.first,
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
                      if (_auth.currentUser != null)
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
                    widget.opportunity.title,
                    style: AppTextStyles.cardTitle(isDark: false).copyWith(
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                      letterSpacing: -0.5,
                      height: 1.3,
                      color:
                          widget.opportunity.title.contains('%') ||
                              widget.opportunity.title.toLowerCase().contains(
                                'indirim',
                              )
                          ? AppColors.discountRed
                          : AppColors.textPrimaryLight,
                    ),
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 12),

                  // Subtitle
                  if (widget.opportunity.subtitle.isNotEmpty)
                    Text(
                      widget.opportunity.subtitle,
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
                  if (widget.opportunity.tags.length > 1)
                    Wrap(
                      spacing: 10,
                      runSpacing: 10,
                      children: widget.opportunity.tags.skip(1).take(3).map((
                        tag,
                      ) {
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
    );
  }
}
