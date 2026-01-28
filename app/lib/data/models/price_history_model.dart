/// Fiyat Geçmişi Modeli
class PriceHistoryModel {
  final String id;
  final double price;
  final double? discountPercentage;
  final String currency;
  final DateTime recordedAt;
  final String source;

  const PriceHistoryModel({
    required this.id,
    required this.price,
    this.discountPercentage,
    required this.currency,
    required this.recordedAt,
    required this.source,
  });

  /// Map'ten model oluşturur
  factory PriceHistoryModel.fromMap(Map<String, dynamic> map) {
    return PriceHistoryModel(
      id: map['id'] as String,
      price: (map['price'] as num).toDouble(),
      discountPercentage: map['discountPercentage'] != null
          ? (map['discountPercentage'] as num).toDouble()
          : null,
      currency: map['currency'] as String? ?? 'TRY',
      recordedAt: DateTime.parse(map['recordedAt'] as String),
      source: map['source'] as String? ?? 'system',
    );
  }

  /// Model'den Map'e çevirir
  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'price': price,
      'discountPercentage': discountPercentage,
      'currency': currency,
      'recordedAt': recordedAt.toIso8601String(),
      'source': source,
    };
  }
}
