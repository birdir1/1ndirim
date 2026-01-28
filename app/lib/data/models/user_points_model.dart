/// Kullanıcı Puanları Modeli
class UserPointsModel {
  final int points;
  final int totalPointsEarned;
  final int level;
  final DateTime createdAt;
  final DateTime updatedAt;

  const UserPointsModel({
    required this.points,
    required this.totalPointsEarned,
    required this.level,
    required this.createdAt,
    required this.updatedAt,
  });

  /// Map'ten model oluşturur
  factory UserPointsModel.fromMap(Map<String, dynamic> map) {
    return UserPointsModel(
      points: map['points'] as int? ?? 0,
      totalPointsEarned: map['totalPointsEarned'] as int? ?? 0,
      level: map['level'] as int? ?? 1,
      createdAt: DateTime.parse(map['createdAt'] as String),
      updatedAt: DateTime.parse(map['updatedAt'] as String),
    );
  }

  /// Model'den Map'e çevirir
  Map<String, dynamic> toMap() {
    return {
      'points': points,
      'totalPointsEarned': totalPointsEarned,
      'level': level,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  /// Bir sonraki seviyeye kaç puan kaldığını hesaplar
  int get pointsToNextLevel {
    final nextLevelPoints = level * 100;
    return nextLevelPoints - totalPointsEarned;
  }

  /// Seviye ilerleme yüzdesini hesaplar (0.0 - 1.0)
  double get levelProgress {
    final currentLevelPoints = (level - 1) * 100;
    final nextLevelPoints = level * 100;
    final progress = totalPointsEarned - currentLevelPoints;
    final total = nextLevelPoints - currentLevelPoints;
    return (progress / total).clamp(0.0, 1.0);
  }
}
