/// Premium Özellik Modeli
class PremiumFeatureModel {
  final String id;
  final String featureKey;
  final String featureName;
  final String? description;

  const PremiumFeatureModel({
    required this.id,
    required this.featureKey,
    required this.featureName,
    this.description,
  });

  factory PremiumFeatureModel.fromMap(Map<String, dynamic> map) {
    return PremiumFeatureModel(
      id: map['id'] as String,
      featureKey: map['featureKey'] as String,
      featureName: map['featureName'] as String,
      description: map['description'] as String?,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'featureKey': featureKey,
      'featureName': featureName,
      'description': description,
    };
  }
}
