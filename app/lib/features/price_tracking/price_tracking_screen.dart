import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/utils/network_result.dart';
import '../../core/utils/page_transitions.dart';

import '../../data/models/price_tracking_model.dart';
import '../../data/models/price_history_model.dart';
import '../../data/models/opportunity_model.dart';
import '../../data/repositories/price_tracking_repository.dart';
import '../../data/repositories/opportunity_repository.dart';
import '../../core/widgets/empty_state.dart';
import '../home/campaign_detail_screen.dart';

/// Fiyat Takibi Ekranı
/// Kullanıcının takip ettiği kampanyaları ve fiyat geçmişlerini gösterir
class PriceTrackingScreen extends StatefulWidget {
  const PriceTrackingScreen({super.key});

  @override
  State<PriceTrackingScreen> createState() => _PriceTrackingScreenState();
}

class _PriceTrackingScreenState extends State<PriceTrackingScreen> {
  final PriceTrackingRepository _repository = PriceTrackingRepository();
  NetworkResult<List<PriceTrackingModel>>? _trackingResult;
  final Map<String, List<PriceHistoryModel>> _priceHistories = {};
  final Map<String, bool> _loadingHistories = {};
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadPriceTracking();
  }

  Future<void> _loadPriceTracking() async {
    if (_isLoading) return;

    setState(() {
      _isLoading = true;
    });

    final result = await _repository.getPriceTracking();

    if (mounted) {
      setState(() {
        _trackingResult = result;
        _isLoading = false;
      });

      // Her kampanya için fiyat geçmişini yükle
      if (result is NetworkSuccess<List<PriceTrackingModel>>) {
        for (final tracking in result.data) {
          _loadPriceHistory(tracking.campaignId);
        }
      }
    }
  }

  Future<void> _loadPriceHistory(String campaignId) async {
    if (_loadingHistories[campaignId] == true) return;

    setState(() {
      _loadingHistories[campaignId] = true;
    });

    final result = await _repository.getPriceHistory(campaignId, limit: 10);

    if (mounted) {
      setState(() {
        _loadingHistories[campaignId] = false;
        if (result is NetworkSuccess<List<PriceHistoryModel>>) {
          _priceHistories[campaignId] = result.data;
        }
      });
    }
  }

  Future<void> _removeTracking(String campaignId) async {
    final result = await _repository.removePriceTracking(campaignId);

    if (mounted) {
      if (result is NetworkSuccess) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Fiyat takibi durduruldu'),
            backgroundColor: AppColors.success,
          ),
        );
        _loadPriceTracking();
      } else if (result is NetworkError) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result.message),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  Future<void> _navigateToCampaignDetail(String campaignId) async {
    // Kampanya detayını yükle
    final opportunityRepo = OpportunityRepository.instance;
    final result = await opportunityRepo.getOpportunityById(campaignId);

    if (!mounted) return;

    if (result is NetworkSuccess<OpportunityModel>) {
      Navigator.of(context).push(
        SlidePageRoute(
          child: CampaignDetailScreen.fromOpportunity(opportunity: result.data),
          direction: SlideDirection.left,
        ),
      );
    } else if (result is NetworkError<OpportunityModel>) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Kampanya detayı yüklenemedi: ${result.message}'),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      appBar: AppBar(
        backgroundColor: AppColors.backgroundLight,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.textPrimaryLight),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text(
          'Fiyat Takibi',
          style: AppTextStyles.sectionTitle(isDark: false),
        ),
        centerTitle: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: AppColors.textPrimaryLight),
            onPressed: _loadPriceTracking,
            tooltip: 'Yenile',
          ),
        ],
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(color: AppColors.primaryLight),
            )
          : RefreshIndicator(
              onRefresh: _loadPriceTracking,
              color: AppColors.primaryLight,
              child: _buildContent(),
            ),
    );
  }

  Widget _buildContent() {
    if (_trackingResult is NetworkError) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 48, color: AppColors.error),
            const SizedBox(height: 16),
            Text(
              (_trackingResult as NetworkError).message,
              style: AppTextStyles.body(
                isDark: false,
              ).copyWith(color: AppColors.textSecondaryLight),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadPriceTracking,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primaryLight,
              ),
              child: const Text('Tekrar Dene'),
            ),
          ],
        ),
      );
    }

    if (_trackingResult is! NetworkSuccess<List<PriceTrackingModel>>) {
      return const SizedBox.shrink();
    }

    final tracking =
        (_trackingResult as NetworkSuccess<List<PriceTrackingModel>>).data;

    if (tracking.isEmpty) {
      return AppEmptyState(
        icon: Icons.track_changes,
        title: 'Takip edilen kampanya yok',
        description: 'Kampanya detayından fiyat takibini başlatabilirsiniz',
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(20),
      itemCount: tracking.length,
      itemBuilder: (context, index) {
        final item = tracking[index];
        return _buildTrackingCard(item);
      },
    );
  }

  Widget _buildTrackingCard(PriceTrackingModel tracking) {
    final history = _priceHistories[tracking.campaignId] ?? [];
    final isLoadingHistory = _loadingHistories[tracking.campaignId] == true;

    // Fiyat değişikliği hesapla
    double? priceChange;
    String? priceChangeText;
    Color? priceChangeColor;

    if (history.length >= 2 && tracking.currentPrice != null) {
      final previousPrice = history[1].price;
      final currentPrice = tracking.currentPrice!;
      priceChange = currentPrice - previousPrice;

      if (priceChange > 0) {
        priceChangeText =
            '+${priceChange.toStringAsFixed(2)} ${tracking.priceCurrency}';
        priceChangeColor = AppColors.error;
      } else if (priceChange < 0) {
        priceChangeText =
            '${priceChange.toStringAsFixed(2)} ${tracking.priceCurrency}';
        priceChangeColor = AppColors.success;
      } else {
        priceChangeText = 'Değişmedi';
        priceChangeColor = AppColors.textSecondaryLight;
      }
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: AppColors.cardBackground,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: AppColors.shadowDark.withValues(alpha: 0.1),
            blurRadius: 12,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        tracking.campaignTitle,
                        style: AppTextStyles.body(
                          isDark: false,
                        ).copyWith(fontWeight: FontWeight.bold),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        tracking.sourceName,
                        style: AppTextStyles.caption(
                          isDark: false,
                        ).copyWith(color: AppColors.textSecondaryLight),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close, size: 20),
                  color: AppColors.error,
                  onPressed: () => _removeTracking(tracking.campaignId),
                  tooltip: 'Takibi durdur',
                ),
              ],
            ),
          ),

          // Fiyat Bilgileri
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: [
                Expanded(
                  child: _buildPriceInfo(
                    label: 'Güncel Fiyat',
                    value: tracking.currentPrice != null
                        ? '${tracking.currentPrice!.toStringAsFixed(2)} ${tracking.priceCurrency}'
                        : 'Belirtilmemiş',
                    color: AppColors.primaryLight,
                  ),
                ),
                if (tracking.originalPrice != null)
                  Expanded(
                    child: _buildPriceInfo(
                      label: 'Orijinal Fiyat',
                      value:
                          '${tracking.originalPrice!.toStringAsFixed(2)} ${tracking.priceCurrency}',
                      color: AppColors.textSecondaryLight,
                    ),
                  ),
                if (tracking.discountPercentage != null)
                  Expanded(
                    child: _buildPriceInfo(
                      label: 'İndirim',
                      value:
                          '%${tracking.discountPercentage!.toStringAsFixed(0)}',
                      color: AppColors.success,
                    ),
                  ),
              ],
            ),
          ),

          // Fiyat Değişikliği
          if (priceChangeText != null)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: priceChangeColor!.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    Icon(
                      priceChange! > 0
                          ? Icons.trending_up
                          : Icons.trending_down,
                      size: 16,
                      color: priceChangeColor,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      priceChangeText,
                      style: AppTextStyles.caption(isDark: false).copyWith(
                        color: priceChangeColor,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ),

          // Hedef Fiyat
          if (tracking.targetPrice != null)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
              child: Row(
                children: [
                  Icon(Icons.flag, size: 16, color: AppColors.warning),
                  const SizedBox(width: 8),
                  Text(
                    'Hedef: ${tracking.targetPrice!.toStringAsFixed(2)} ${tracking.priceCurrency}',
                    style: AppTextStyles.caption(
                      isDark: false,
                    ).copyWith(color: AppColors.warning),
                  ),
                ],
              ),
            ),

          const SizedBox(height: 12),

          // Fiyat Geçmişi
          if (isLoadingHistory)
            const Padding(
              padding: EdgeInsets.all(16),
              child: Center(
                child: SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: AppColors.primaryLight,
                  ),
                ),
              ),
            )
          else if (history.isEmpty)
            Padding(
              padding: const EdgeInsets.all(16),
              child: Text(
                'Henüz fiyat geçmişi yok',
                style: AppTextStyles.caption(
                  isDark: false,
                ).copyWith(color: AppColors.textSecondaryLight),
                textAlign: TextAlign.center,
              ),
            )
          else
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.surfaceLight,
                borderRadius: const BorderRadius.vertical(
                  bottom: Radius.circular(20),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Fiyat Geçmişi',
                    style: AppTextStyles.caption(isDark: false).copyWith(
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimaryLight,
                    ),
                  ),
                  const SizedBox(height: 8),
                  ...history
                      .take(5)
                      .map(
                        (h) => Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                DateFormat(
                                  'dd.MM.yyyy HH:mm',
                                  'tr_TR',
                                ).format(h.recordedAt),
                                style: AppTextStyles.caption(
                                  isDark: false,
                                ).copyWith(color: AppColors.textSecondaryLight),
                              ),
                              Text(
                                '${h.price.toStringAsFixed(2)} ${h.currency}',
                                style: AppTextStyles.caption(isDark: false)
                                    .copyWith(
                                      fontWeight: FontWeight.bold,
                                      color: AppColors.textPrimaryLight,
                                    ),
                              ),
                            ],
                          ),
                        ),
                      ),
                ],
              ),
            ),

          // Detay Butonu
          Padding(
            padding: const EdgeInsets.all(16),
            child: SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => _navigateToCampaignDetail(tracking.campaignId),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primaryLight,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: Text(
                  'Kampanya Detayı',
                  style: AppTextStyles.body(
                    isDark: false,
                  ).copyWith(color: Colors.white, fontWeight: FontWeight.bold),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPriceInfo({
    required String label,
    required String value,
    required Color color,
  }) {
    return Column(
      children: [
        Text(
          value,
          style: AppTextStyles.body(
            isDark: false,
          ).copyWith(fontWeight: FontWeight.bold, color: color),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: AppTextStyles.caption(
            isDark: false,
          ).copyWith(color: AppColors.textSecondaryLight),
        ),
      ],
    );
  }
}
