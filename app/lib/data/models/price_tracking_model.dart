/// Fiyat Takibi Modeli
class PriceTrackingModel {
  final String id;
  final String campaignId;
  final String campaignTitle;
  final String sourceName;
  final double? currentPrice;
  final double? originalPrice;
  final double? discountPercentage;
  final String priceCurrency;
  final double? targetPrice;
  final bool notifyOnDrop;
  final bool notifyOnIncrease;
  final DateTime createdAt;

  const PriceTrackingModel({
    required this.id,
    required this.campaignId,
    required this.campaignTitle,
    required this.sourceName,
    this.currentPrice,
    this.originalPrice,
    this.discountPercentage,
    required this.priceCurrency,
    this.targetPrice,
    required this.notifyOnDrop,
    required this.notifyOnIncrease,
    required this.createdAt,
  });

  /// Map'ten model oluşturur
  factory PriceTrackingModel.fromMap(Map<String, dynamic> map) {
    return PriceTrackingModel(
      id: map['id'] as String,
      campaignId: map['campaignId'] as String,
      campaignTitle: map['campaignTitle'] as String,
      sourceName: map['sourceName'] as String,
      currentPrice: map['currentPrice'] != null
          ? (map['currentPrice'] as num).toDouble()
          : null,
      originalPrice: map['originalPrice'] != null
          ? (map['originalPrice'] as num).toDouble()
          : null,
      discountPercentage: map['discountPercentage'] != null
          ? (map['discountPercentage'] as num).toDouble()
          : null,
      priceCurrency: map['priceCurrency'] as String? ?? 'TRY',
      targetPrice: map['targetPrice'] != null
          ? (map['targetPrice'] as num).toDouble()
          : null,
      notifyOnDrop: map['notifyOnDrop'] as bool? ?? true,
      notifyOnIncrease: map['notifyOnIncrease'] as bool? ?? false,
      createdAt: DateTime.parse(map['createdAt'] as String),
    );
  }

  /// Model'den Map'e çevirir
  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'campaignId': campaignId,
      'campaignTitle': campaignTitle,
      'sourceName': sourceName,
      'currentPrice': currentPrice,
      'originalPrice': originalPrice,
      'discountPercentage': discountPercentage,
      'priceCurrency': priceCurrency,
      'targetPrice': targetPrice,
      'notifyOnDrop': notifyOnDrop,
      'notifyOnIncrease': notifyOnIncrease,
      'createdAt': createdAt.toIso8601String(),
    };
  }
}
