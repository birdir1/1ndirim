/// Topluluk İstatistikleri Modeli
class CommunityStatsModel {
  final int totalUsers;
  final int totalFavorites;
  final int totalComments;
  final int totalRatings;
  final int totalBadges;
  final int totalPoints;
  final int maxLevel;

  const CommunityStatsModel({
    required this.totalUsers,
    required this.totalFavorites,
    required this.totalComments,
    required this.totalRatings,
    required this.totalBadges,
    required this.totalPoints,
    required this.maxLevel,
  });

  /// Map'ten model oluşturur
  factory CommunityStatsModel.fromMap(Map<String, dynamic> map) {
    return CommunityStatsModel(
      totalUsers: map['totalUsers'] as int? ?? 0,
      totalFavorites: map['totalFavorites'] as int? ?? 0,
      totalComments: map['totalComments'] as int? ?? 0,
      totalRatings: map['totalRatings'] as int? ?? 0,
      totalBadges: map['totalBadges'] as int? ?? 0,
      totalPoints: map['totalPoints'] as int? ?? 0,
      maxLevel: map['maxLevel'] as int? ?? 1,
    );
  }

  /// Model'den Map'e çevirir
  Map<String, dynamic> toMap() {
    return {
      'totalUsers': totalUsers,
      'totalFavorites': totalFavorites,
      'totalComments': totalComments,
      'totalRatings': totalRatings,
      'totalBadges': totalBadges,
      'totalPoints': totalPoints,
      'maxLevel': maxLevel,
    };
  }
}
