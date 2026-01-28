/// Kullanıcı Rozeti Modeli
class UserBadgeModel {
  final String id;
  final String badgeKey;
  final String name;
  final String description;
  final String iconName;
  final String iconColor;
  final String rarity; // 'common', 'rare', 'epic', 'legendary'
  final DateTime earnedAt;

  const UserBadgeModel({
    required this.id,
    required this.badgeKey,
    required this.name,
    required this.description,
    required this.iconName,
    required this.iconColor,
    required this.rarity,
    required this.earnedAt,
  });

  /// Map'ten model oluşturur
  factory UserBadgeModel.fromMap(Map<String, dynamic> map) {
    return UserBadgeModel(
      id: map['id'] as String,
      badgeKey: map['badgeKey'] as String,
      name: map['name'] as String,
      description: map['description'] as String,
      iconName: map['iconName'] as String,
      iconColor: map['iconColor'] as String,
      rarity: map['rarity'] as String,
      earnedAt: DateTime.parse(map['earnedAt'] as String),
    );
  }

  /// Model'den Map'e çevirir
  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'badgeKey': badgeKey,
      'name': name,
      'description': description,
      'iconName': iconName,
      'iconColor': iconColor,
      'rarity': rarity,
      'earnedAt': earnedAt.toIso8601String(),
    };
  }
}
