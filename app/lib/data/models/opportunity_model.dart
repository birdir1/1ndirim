import 'package:flutter/material.dart';

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
    };
  }
}
