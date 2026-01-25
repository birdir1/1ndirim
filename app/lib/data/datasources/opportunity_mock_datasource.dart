import 'package:flutter/material.dart';
import '../models/opportunity_model.dart';
import '../../core/theme/app_colors.dart';

/// Mock Opportunity Data Source
/// API entegrasyonu sonrası bu dosya değiştirilecek
class OpportunityMockDataSource {
  /// Tüm fırsatları getirir
  Future<List<OpportunityModel>> getOpportunities() async {
    // Simüle edilmiş API delay
    await Future.delayed(const Duration(milliseconds: 300));

    return [
      OpportunityModel(
        id: '1',
        title: '%50 İndirim',
        subtitle: 'Netflix / Yapı Kredi',
        sourceName: 'Yapı Kredi',
        icon: Icons.play_arrow,
        iconColor: AppColors.discountRed, // Kan Kırmızısı - İndirim vurgusu
        iconBgColor: AppColors.discountRedLight, // Açık kırmızı arka plan
        tags: const ['Online', 'Son 2 gün'],
      ),
      OpportunityModel(
        id: '2',
        title: '1 Kahve Hediye',
        subtitle: 'Starbucks / Akbank',
        sourceName: 'Akbank',
        icon: Icons.local_cafe,
        iconColor: AppColors.opportunityGreen,
        iconBgColor: AppColors.opportunityGreenLight,
        tags: const ['Mağazada', 'Son 5 gün'],
      ),
      OpportunityModel(
        id: '3',
        title: '200 TL Puan',
        subtitle: 'Trendyol / Garanti BBVA',
        sourceName: 'Garanti BBVA',
        icon: Icons.shopping_bag,
        iconColor: AppColors.opportunityBlue, // Mavi - Vurgu alanı
        iconBgColor: AppColors.opportunityBlueLight, // Açık mavi arka plan
        tags: const ['Online'],
      ),
      OpportunityModel(
        id: '4',
        title: '%20 İndirim',
        subtitle: 'THY / Turkcell Platinum',
        sourceName: 'Turkcell',
        icon: Icons.flight,
        iconColor: AppColors.discountRed, // Kan Kırmızısı - İndirim vurgusu
        iconBgColor: AppColors.discountRedLight, // Açık kırmızı arka plan
        tags: const ['Yurt Dışı', 'Son 1 hafta'],
      ),
    ];
  }

  /// Seçili kaynaklara göre fırsatları filtreler
  Future<List<OpportunityModel>> getOpportunitiesBySources(
    List<String> sourceNames,
  ) async {
    final allOpportunities = await getOpportunities();
    return allOpportunities
        .where((opp) => sourceNames.contains(opp.sourceName))
        .toList();
  }
}
