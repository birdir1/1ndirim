/// Premium Plan Modeli
class PremiumPlanModel {
  final String id;
  final String planKey;
  final String planName;
  final String? description;
  final double? priceMonthly;
  final double? priceYearly;
  final String currency;
  final List<String> features;
  final int displayOrder;

  const PremiumPlanModel({
    required this.id,
    required this.planKey,
    required this.planName,
    this.description,
    this.priceMonthly,
    this.priceYearly,
    required this.currency,
    required this.features,
    required this.displayOrder,
  });

  factory PremiumPlanModel.fromMap(Map<String, dynamic> map) {
    return PremiumPlanModel(
      id: map['id'] as String,
      planKey: map['planKey'] as String,
      planName: map['planName'] as String,
      description: map['description'] as String?,
      priceMonthly: map['priceMonthly'] != null
          ? (map['priceMonthly'] as num).toDouble()
          : null,
      priceYearly: map['priceYearly'] != null
          ? (map['priceYearly'] as num).toDouble()
          : null,
      currency: map['currency'] as String? ?? 'TRY',
      features: (map['features'] as List<dynamic>?)
              ?.map((f) => f.toString())
              .toList() ??
          [],
      displayOrder: map['displayOrder'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'planKey': planKey,
      'planName': planName,
      'description': description,
      'priceMonthly': priceMonthly,
      'priceYearly': priceYearly,
      'currency': currency,
      'features': features,
      'displayOrder': displayOrder,
    };
  }
}
