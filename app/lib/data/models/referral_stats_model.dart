/// Referral Stats Model
class ReferralStatsModel {
  final int totalReferrals;
  final int completedReferrals;
  final int pendingReferrals;
  final int totalRewards;

  const ReferralStatsModel({
    required this.totalReferrals,
    required this.completedReferrals,
    required this.pendingReferrals,
    required this.totalRewards,
  });

  /// Map'ten model oluşturur
  factory ReferralStatsModel.fromMap(Map<String, dynamic> map) {
    return ReferralStatsModel(
      totalReferrals: map['totalReferrals'] as int? ?? 0,
      completedReferrals: map['completedReferrals'] as int? ?? 0,
      pendingReferrals: map['pendingReferrals'] as int? ?? 0,
      totalRewards: map['totalRewards'] as int? ?? 0,
    );
  }

  /// Model'den Map'e çevirir
  Map<String, dynamic> toMap() {
    return {
      'totalReferrals': totalReferrals,
      'completedReferrals': completedReferrals,
      'pendingReferrals': pendingReferrals,
      'totalRewards': totalRewards,
    };
  }

  /// Empty stats
  factory ReferralStatsModel.empty() {
    return const ReferralStatsModel(
      totalReferrals: 0,
      completedReferrals: 0,
      pendingReferrals: 0,
      totalRewards: 0,
    );
  }

  @override
  String toString() {
    return 'ReferralStatsModel(total: $totalReferrals, completed: $completedReferrals, pending: $pendingReferrals, rewards: $totalRewards)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is ReferralStatsModel &&
        other.totalReferrals == totalReferrals &&
        other.completedReferrals == completedReferrals &&
        other.pendingReferrals == pendingReferrals &&
        other.totalRewards == totalRewards;
  }

  @override
  int get hashCode {
    return totalReferrals.hashCode ^
        completedReferrals.hashCode ^
        pendingReferrals.hashCode ^
        totalRewards.hashCode;
  }
}
