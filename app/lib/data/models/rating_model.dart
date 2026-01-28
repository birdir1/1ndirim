/// Kampanya Puanlama Modeli
class RatingModel {
  final int totalRatings;
  final double averageRating;
  final Map<int, int> ratingDistribution; // {5: 10, 4: 5, ...}
  final int? userRating; // Kullanıcının verdiği puan (null olabilir)

  const RatingModel({
    required this.totalRatings,
    required this.averageRating,
    required this.ratingDistribution,
    this.userRating,
  });

  /// Map'ten model oluşturur
  factory RatingModel.fromMap(Map<String, dynamic> map) {
    final distribution = map['ratingDistribution'] as Map<String, dynamic>;
    return RatingModel(
      totalRatings: map['totalRatings'] as int? ?? 0,
      averageRating: (map['averageRating'] as num?)?.toDouble() ?? 0.0,
      ratingDistribution: {
        5: distribution['5'] as int? ?? 0,
        4: distribution['4'] as int? ?? 0,
        3: distribution['3'] as int? ?? 0,
        2: distribution['2'] as int? ?? 0,
        1: distribution['1'] as int? ?? 0,
      },
      userRating: map['userRating'] as int?,
    );
  }

  /// Model'den Map'e çevirir
  Map<String, dynamic> toMap() {
    return {
      'totalRatings': totalRatings,
      'averageRating': averageRating,
      'ratingDistribution': ratingDistribution,
      'userRating': userRating,
    };
  }
}
