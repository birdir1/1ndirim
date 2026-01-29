import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/utils/page_transitions.dart';
import '../../core/utils/source_logo_helper.dart';
import '../../data/models/opportunity_model.dart';
import '../home/campaign_detail_screen.dart';

/// Kampanya Karşılaştırma Ekranı
/// Kullanıcıların seçtiği kampanyaları yan yana karşılaştırmasını sağlar
class CompareScreen extends StatefulWidget {
  final List<OpportunityModel> campaigns;

  const CompareScreen({super.key, required this.campaigns});

  @override
  State<CompareScreen> createState() => _CompareScreenState();
}

class _CompareScreenState extends State<CompareScreen> {
  static const int minCompareCount = 2;
  static const int maxCompareCount = 3;
  List<OpportunityModel> _selectedCampaigns = [];

  @override
  void initState() {
    super.initState();
    _selectedCampaigns = List.from(widget.campaigns);
  }

  void _removeCampaign(OpportunityModel campaign) {
    setState(() {
      _selectedCampaigns.removeWhere((c) => c.id == campaign.id);
    });
  }

  void _clearAll() {
    setState(() {
      _selectedCampaigns.clear();
    });
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
          'Kampanya Karşılaştırma',
          style: AppTextStyles.headline(isDark: false),
        ),
        centerTitle: false,
        actions: [
          if (_selectedCampaigns.isNotEmpty)
            IconButton(
              icon: const Icon(
                Icons.clear_all,
                color: AppColors.textPrimaryLight,
              ),
              onPressed: _clearAll,
              tooltip: 'Tümünü temizle',
            ),
        ],
      ),
      body: _selectedCampaigns.isEmpty
          ? _buildEmptyState()
          : SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Bilgi kartı
                  _buildInfoCard(),
                  const SizedBox(height: 20),
                  // Karşılaştırma tablosu
                  _buildComparisonTable(),
                ],
              ),
            ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.compare_arrows,
            size: 64,
            color: AppColors.textSecondaryLight,
          ),
          const SizedBox(height: 16),
          Text(
            'Karşılaştırılacak kampanya yok',
            style: AppTextStyles.headline(
              isDark: false,
            ).copyWith(color: AppColors.textPrimaryLight),
          ),
          const SizedBox(height: 8),
          Text(
            'En az $minCompareCount, en fazla $maxCompareCount kampanyayı karşılaştırabilirsiniz',
            style: AppTextStyles.body(
              isDark: false,
            ).copyWith(color: AppColors.textSecondaryLight),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildInfoCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.primaryLight.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: AppColors.primaryLight.withValues(alpha: 0.3),
          width: 1,
        ),
      ),
      child: Row(
        children: [
          Icon(Icons.info_outline, color: AppColors.primaryLight, size: 20),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              '${_selectedCampaigns.length} kampanya karşılaştırılıyor (Min: $minCompareCount, Maks: $maxCompareCount)',
              style: AppTextStyles.body(
                isDark: false,
              ).copyWith(color: AppColors.textPrimaryLight),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildComparisonTable() {
    return Container(
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
        children: [
          // Başlık satırı
          _buildTableHeader(),
          // Kampanya bilgileri
          _buildComparisonRows(),
        ],
      ),
    );
  }

  Widget _buildTableHeader() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.primaryLight.withValues(alpha: 0.1),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Padding(
              padding: const EdgeInsets.only(top: 20),
              child: Text(
                'Özellik',
                style: AppTextStyles.caption(isDark: false).copyWith(
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimaryLight,
                  fontSize: 12,
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: _selectedCampaigns.map((campaign) {
                final sourceColor = SourceLogoHelper.getLogoBackgroundColor(
                  campaign.sourceName,
                );

                return Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    child: Column(
                      children: [
                        Container(
                          width: 50,
                          height: 50,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(
                              color: sourceColor.withValues(alpha: 0.3),
                              width: 1.5,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: sourceColor.withValues(alpha: 0.15),
                                blurRadius: 6,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: Padding(
                            padding: const EdgeInsets.all(6.0),
                            child: SourceLogoHelper.getLogoWidget(
                              campaign.sourceName,
                              width: 38,
                              height: 38,
                            ),
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          campaign.sourceName,
                          style: AppTextStyles.caption(isDark: false).copyWith(
                            fontWeight: FontWeight.bold,
                            color: AppColors.textPrimaryLight,
                            fontSize: 11,
                          ),
                          textAlign: TextAlign.center,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildComparisonRows() {
    final rows = [
      {
        'label': 'Başlık',
        'values': _selectedCampaigns.map((c) => c.title).toList(),
        'maxLines': 4, // Daha fazla satır için başlık
      },
      {
        'label': 'Açıklama',
        'values': _selectedCampaigns.map((c) => c.subtitle).toList(),
        'maxLines': 5, // Daha fazla satır için açıklama
      },
      {
        'label': 'Bitiş Tarihi',
        'values': _selectedCampaigns.map((c) {
          if (c.expiresAt == null) return 'Belirtilmemiş';
          try {
            final date = DateTime.parse(c.expiresAt!);
            return '${date.day}/${date.month}/${date.year}';
          } catch (e) {
            return 'Geçersiz tarih';
          }
        }).toList(),
        'maxLines': 2,
      },
    ];

    return Column(
      children: [
        ...rows.asMap().entries.map((entry) {
          final index = entry.key;
          final row = entry.value;
          final isLast = index == rows.length - 1;

          return _buildComparisonRow(
            label: row['label'] as String,
            values: row['values'] as List<String>,
            maxLines: row['maxLines'] as int? ?? 3,
            isLast: isLast,
          );
        }),
        // İşlemler satırı
        _buildActionsRow(),
      ],
    );
  }

  Widget _buildComparisonRow({
    required String label,
    required List<String> values,
    int maxLines = 3,
    bool isLast = false,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
      decoration: BoxDecoration(
        border: Border(
          bottom: isLast
              ? BorderSide.none
              : BorderSide(
                  color: AppColors.textSecondaryLight.withValues(alpha: 0.1),
                  width: 1,
                ),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              label,
              style: AppTextStyles.caption(isDark: false).copyWith(
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimaryLight,
                fontSize: 12,
              ),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: values.asMap().entries.map((entry) {
                final value = entry.value;
                final isEmpty = value.isEmpty || value == 'null';

                return Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    child: Text(
                      isEmpty ? '-' : value,
                      style: AppTextStyles.caption(isDark: false).copyWith(
                        color: isEmpty
                            ? AppColors.textSecondaryLight
                            : AppColors.textPrimaryLight,
                        fontSize: 11,
                        height: 1.3,
                      ),
                      textAlign: TextAlign.center,
                      maxLines: maxLines,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionsRow() {
    return Container(
      padding: const EdgeInsets.all(12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(width: 100),
          const SizedBox(width: 8),
          Expanded(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: _selectedCampaigns.map((c) {
                return Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    child: Column(
                      children: [
                        // Detay butonu
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            child: const Text(
                              'Detay',
                              style: TextStyle(fontSize: 11),
                            ),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.primaryLight,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(
                                vertical: 8,
                                horizontal: 4,
                              ),
                              textStyle: const TextStyle(fontSize: 11),
                              minimumSize: const Size(0, 32),
                            ),
                            onPressed: () {
                              Navigator.of(context).push(
                                SlidePageRoute(
                                  child: CampaignDetailScreen.fromOpportunity(
                                    opportunity: c,
                                  ),
                                  direction: SlideDirection.left,
                                ),
                              );
                            },
                          ),
                        ),
                        const SizedBox(height: 6),
                        // Kaldır butonu
                        SizedBox(
                          width: double.infinity,
                          child: OutlinedButton(
                            child: const Text(
                              'Kaldır',
                              style: TextStyle(fontSize: 11),
                            ),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: AppColors.error,
                              side: BorderSide(color: AppColors.error),
                              padding: const EdgeInsets.symmetric(
                                vertical: 8,
                                horizontal: 4,
                              ),
                              textStyle: const TextStyle(fontSize: 11),
                              minimumSize: const Size(0, 32),
                            ),
                            onPressed: () => _removeCampaign(c),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }
}
