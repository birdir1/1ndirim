/// Kullanıcı İstatistikleri Modeli
class UserStatsModel {
  final int favoriteCount;
  final int commentCount;
  final int ratingCount;
  final int totalActivity;
  final DateTime? lastActivity;

  const UserStatsModel({
    required this.favoriteCount,
    required this.commentCount,
    required this.ratingCount,
    required this.totalActivity,
    this.lastActivity,
  });

  /// Map'ten model oluşturur
  factory UserStatsModel.fromMap(Map<String, dynamic> map) {
    return UserStatsModel(
      favoriteCount: map['favoriteCount'] as int? ?? 0,
      commentCount: map['commentCount'] as int? ?? 0,
      ratingCount: map['ratingCount'] as int? ?? 0,
      totalActivity: map['totalActivity'] as int? ?? 0,
      lastActivity: map['lastActivity'] != null
          ? DateTime.parse(map['lastActivity'] as String)
          : null,
    );
  }

  /// Model'den Map'e çevirir
  Map<String, dynamic> toMap() {
    return {
      'favoriteCount': favoriteCount,
      'commentCount': commentCount,
      'ratingCount': ratingCount,
      'totalActivity': totalActivity,
      'lastActivity': lastActivity?.toIso8601String(),
    };
  }
}
