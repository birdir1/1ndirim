import 'package:flutter/material.dart';

// Metin temizleme yardımcıları
String normalizeText(String input) {
  var out = input.trim();
  out = out.replaceAll(RegExp(r'\s+'), ' ');
  out = out.replaceAll(RegExp(r'^[\.,;:!\-\s]+'), '');
  out = out.replaceAll(RegExp(r'[\.,;:!\-\s]+$'), '');
  // Bozuk placeholder'ları süpür
  if (RegExp(r'000\s*tl', caseSensitive: false).hasMatch(out)) return '';
  return out;
}

bool isDateOnlyLine(String input) {
  final t = normalizeText(input).toLowerCase();
  if (t.isEmpty) return false;
  final hasDateWord = RegExp(
    r'(tarih|geçerlidir|gecerlidir|son gün|songun|arasında|kampanya)',
    caseSensitive: false,
  ).hasMatch(t);
  final hasMonthOrYear = RegExp(
    r'(ocak|şubat|subat|mart|nisan|mayıs|mayis|haziran|temmuz|ağustos|agustos|eylül|eylul|ekim|kasım|kasim|aralık|aralik|20\d{2}|\d{1,2}[./]\d{1,2}[./]\d{2,4})',
    caseSensitive: false,
  ).hasMatch(t);
  return hasDateWord && hasMonthOrYear;
}

bool isSameMeaning(String a, String b) {
  final na = normalizeText(a).toLowerCase();
  final nb = normalizeText(b).toLowerCase();
  if (na.isEmpty || nb.isEmpty) return false;
  return na == nb || na.startsWith(nb) || nb.startsWith(na);
}

/// Fırsat Modeli
class OpportunityModel {
  final String id;
  final String title;
  final String subtitle;
  final String sourceName;
  final IconData icon;
  final Color iconColor;
  final Color iconBgColor;
  final List<String> tags;
  final String? detailText; // Uzun açıklama
  final String? description; // Kısa açıklama / özet
  final String? affiliateUrl; // YENİ
  final String? originalUrl; // YENİ
  final String? expiresAt; // Kampanya bitiş tarihi (ISO 8601 formatında)
  final double? sourceLatitude; // Kaynak konumu - enlem
  final double? sourceLongitude; // Kaynak konumu - boylam
  final String? sourceCity; // Kaynak şehri
  final String? videoUrl; // Kampanya video URL'i
  final String? videoThumbnailUrl; // Video thumbnail URL'i
  final int? videoDuration; // Video süresi (saniye)
  final double? currentPrice; // Güncel fiyat
  final double? originalPrice; // Orijinal fiyat
  final double? discountPercentage; // İndirim yüzdesi
  final String? priceCurrency; // Para birimi

  const OpportunityModel({
    required this.id,
    required this.title,
    required this.subtitle,
    required this.sourceName,
    required this.icon,
    required this.iconColor,
    required this.iconBgColor,
    required this.tags,
    this.detailText,
    this.description,
    this.affiliateUrl, // YENİ
    this.originalUrl, // YENİ
    this.expiresAt,
    this.sourceLatitude,
    this.sourceLongitude,
    this.sourceCity,
    this.videoUrl,
    this.videoThumbnailUrl,
    this.videoDuration,
    this.currentPrice,
    this.originalPrice,
    this.discountPercentage,
    this.priceCurrency,
  });

  /// Map'ten model oluşturur
  factory OpportunityModel.fromMap(Map<String, dynamic> map) {
    return OpportunityModel(
      id: map['id'] as String,
      title: map['title'] as String,
      subtitle: map['subtitle'] as String,
      sourceName: map['sourceName'] as String,
      icon: map['icon'] as IconData,
      iconColor: map['iconColor'] as Color,
      iconBgColor: map['iconBgColor'] as Color,
      tags: (map['tags'] as List).map((e) => e.toString()).toList(),
      detailText: map['detailText'] as String?,
      description: map['description'] as String?,
      affiliateUrl: map['affiliateUrl'] as String?, // YENİ
      originalUrl: map['originalUrl'] as String?, // YENİ
      expiresAt: map['expiresAt'] as String?,
      sourceLatitude: map['sourceLatitude'] != null
          ? (map['sourceLatitude'] as num).toDouble()
          : null,
      sourceLongitude: map['sourceLongitude'] != null
          ? (map['sourceLongitude'] as num).toDouble()
          : null,
      sourceCity: map['sourceCity'] as String?,
      videoUrl: map['videoUrl'] as String?,
      videoThumbnailUrl: map['videoThumbnailUrl'] as String?,
      videoDuration: map['videoDuration'] != null
          ? map['videoDuration'] as int
          : null,
      currentPrice: map['currentPrice'] != null
          ? (map['currentPrice'] as num).toDouble()
          : null,
      originalPrice: map['originalPrice'] != null
          ? (map['originalPrice'] as num).toDouble()
          : null,
      discountPercentage: map['discountPercentage'] != null
          ? (map['discountPercentage'] as num).toDouble()
          : null,
      priceCurrency: map['priceCurrency'] as String?,
    );
  }

  /// Model'den Map'e çevirir
  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'title': title,
      'subtitle': subtitle,
      'sourceName': sourceName,
      'icon': icon,
      'iconColor': iconColor,
      'iconBgColor': iconBgColor,
      'tags': tags,
      'detailText': detailText,
      'description': description,
    };
  }
}
