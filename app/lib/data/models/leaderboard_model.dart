/// Leaderboard Modeli
class LeaderboardModel {
  final int rank;
  final String userId;
  final int points;
  final int level;
  final int badgeCount;
  final int favoriteCount;
  final int commentCount;
  final int ratingCount;
  final bool isCurrentUser;

  const LeaderboardModel({
    required this.rank,
    required this.userId,
    required this.points,
    required this.level,
    required this.badgeCount,
    required this.favoriteCount,
    required this.commentCount,
    required this.ratingCount,
    required this.isCurrentUser,
  });

  /// Map'ten model oluşturur
  factory LeaderboardModel.fromMap(Map<String, dynamic> map) {
    return LeaderboardModel(
      rank: map['rank'] as int? ?? 0,
      userId: map['userId'] as String,
      points: map['points'] as int? ?? 0,
      level: map['level'] as int? ?? 1,
      badgeCount: map['badgeCount'] as int? ?? 0,
      favoriteCount: map['favoriteCount'] as int? ?? 0,
      commentCount: map['commentCount'] as int? ?? 0,
      ratingCount: map['ratingCount'] as int? ?? 0,
      isCurrentUser: map['isCurrentUser'] as bool? ?? false,
    );
  }

  /// Model'den Map'e çevirir
  Map<String, dynamic> toMap() {
    return {
      'rank': rank,
      'userId': userId,
      'points': points,
      'level': level,
      'badgeCount': badgeCount,
      'favoriteCount': favoriteCount,
      'commentCount': commentCount,
      'ratingCount': ratingCount,
      'isCurrentUser': isCurrentUser,
    };
  }
}
