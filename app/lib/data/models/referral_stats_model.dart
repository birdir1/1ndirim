/// Referans İstatistikleri Modeli
class ReferralStatsModel {
  final String? referralCode;
  final int totalReferrals;
  final int totalPoints;
  final List<RecentReferral> recentReferrals;

  const ReferralStatsModel({
    this.referralCode,
    required this.totalReferrals,
    required this.totalPoints,
    required this.recentReferrals,
  });

  factory ReferralStatsModel.fromMap(Map<String, dynamic> map) {
    return ReferralStatsModel(
      referralCode: map['referralCode'] as String?,
      totalReferrals: map['totalReferrals'] as int? ?? 0,
      totalPoints: map['totalPoints'] as int? ?? 0,
      recentReferrals: (map['recentReferrals'] as List<dynamic>?)
              ?.map((item) => RecentReferral.fromMap(item as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'referralCode': referralCode,
      'totalReferrals': totalReferrals,
      'totalPoints': totalPoints,
      'recentReferrals': recentReferrals.map((r) => r.toMap()).toList(),
    };
  }
}

/// Son Referans Modeli
class RecentReferral {
  final String referredUserId;
  final DateTime createdAt;
  final int rewardPoints;

  const RecentReferral({
    required this.referredUserId,
    required this.createdAt,
    required this.rewardPoints,
  });

  factory RecentReferral.fromMap(Map<String, dynamic> map) {
    return RecentReferral(
      referredUserId: map['referredUserId'] as String,
      createdAt: DateTime.parse(map['createdAt'] as String),
      rewardPoints: map['rewardPoints'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'referredUserId': referredUserId,
      'createdAt': createdAt.toIso8601String(),
      'rewardPoints': rewardPoints,
    };
  }
}
