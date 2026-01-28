import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/utils/page_transitions.dart';
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
            'En fazla $maxCompareCount kampanyayı karşılaştırabilirsiniz',
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
              '${_selectedCampaigns.length} kampanya karşılaştırılıyor (Maksimum: $maxCompareCount)',
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
          // Kampanya satırları
          ..._selectedCampaigns.asMap().entries.map((entry) {
            final index = entry.key;
            final campaign = entry.value;
            return _buildCampaignRow(campaign, index);
          }),
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
        children: [
          SizedBox(
            width: 120,
            child: Text(
              'Özellik',
              style: AppTextStyles.body(isDark: false).copyWith(
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimaryLight,
              ),
            ),
          ),
          Expanded(
            child: Row(
              children: _selectedCampaigns.map((campaign) {
                return Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 8),
                    child: Column(
                      children: [
                        Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            color: campaign.iconBgColor,
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            campaign.icon,
                            color: campaign.iconColor,
                            size: 20,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          campaign.sourceName,
                          style: AppTextStyles.caption(isDark: false).copyWith(
                            fontWeight: FontWeight.bold,
                            color: AppColors.textPrimaryLight,
                          ),
                          textAlign: TextAlign.center,
                          maxLines: 1,
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

  Widget _buildCampaignRow(OpportunityModel campaign, int index) {
    final isLast = index == _selectedCampaigns.length - 1;

    return Container(
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
      child: Column(
        children: [
          // Başlık
          _buildComparisonRow(
            label: 'Başlık',
            values: _selectedCampaigns.map((c) => c.title).toList(),
            campaignIndex: index,
          ),
          // Kaynak
          _buildComparisonRow(
            label: 'Kaynak',
            values: _selectedCampaigns.map((c) => c.sourceName).toList(),
            campaignIndex: index,
          ),
          // Açıklama
          _buildComparisonRow(
            label: 'Açıklama',
            values: _selectedCampaigns.map((c) => c.subtitle).toList(),
            campaignIndex: index,
            isMultiline: true,
          ),
          // Etiketler
          _buildComparisonRow(
            label: 'Etiketler',
            values: _selectedCampaigns.map((c) => c.tags.join(', ')).toList(),
            campaignIndex: index,
            isEmptyFallback: 'Etiket yok',
          ),
          // Bitiş Tarihi
          _buildComparisonRow(
            label: 'Bitiş Tarihi',
            values: _selectedCampaigns.map((c) {
              if (c.expiresAt == null) return 'Belirtilmemiş';
              try {
                final date = DateTime.parse(c.expiresAt!);
                return '${date.day}/${date.month}/${date.year}';
              } catch (e) {
                return 'Geçersiz tarih';
              }
            }).toList(),
            campaignIndex: index,
          ),
          // İşlemler
          Container(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                const SizedBox(width: 120),
                Expanded(
                  child: Row(
                    children: _selectedCampaigns.map((c) {
                      return Expanded(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 8),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              // Detay butonu
                              IconButton(
                                icon: const Icon(Icons.visibility, size: 18),
                                color: AppColors.primaryLight,
                                onPressed: () {
                                  Navigator.of(context).push(
                                    SlidePageRoute(
                                      child:
                                          CampaignDetailScreen.fromOpportunity(
                                            opportunity: c,
                                          ),
                                      direction: SlideDirection.left,
                                    ),
                                  );
                                },
                                tooltip: 'Detayları gör',
                              ),
                              // Kaldır butonu
                              IconButton(
                                icon: const Icon(Icons.close, size: 18),
                                color: AppColors.error,
                                onPressed: () => _removeCampaign(c),
                                tooltip: 'Kaldır',
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
          ),
        ],
      ),
    );
  }

  Widget _buildComparisonRow({
    required String label,
    required List<String> values,
    required int campaignIndex,
    bool isMultiline = false,
    String? isEmptyFallback,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(
            color: AppColors.textSecondaryLight.withValues(alpha: 0.1),
            width: 1,
          ),
        ),
      ),
      child: Row(
        crossAxisAlignment: isMultiline
            ? CrossAxisAlignment.start
            : CrossAxisAlignment.center,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: AppTextStyles.body(isDark: false).copyWith(
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimaryLight,
              ),
            ),
          ),
          Expanded(
            child: Row(
              crossAxisAlignment: isMultiline
                  ? CrossAxisAlignment.start
                  : CrossAxisAlignment.center,
              children: values.asMap().entries.map((entry) {
                final value = entry.value;
                final isEmpty = value.isEmpty || value == 'null';

                return Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 8),
                    child: Text(
                      isEmpty ? (isEmptyFallback ?? '-') : value,
                      style: AppTextStyles.body(isDark: false).copyWith(
                        color: isEmpty
                            ? AppColors.textSecondaryLight
                            : AppColors.textPrimaryLight,
                      ),
                      textAlign: TextAlign.center,
                      maxLines: isMultiline ? 3 : 1,
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
}
