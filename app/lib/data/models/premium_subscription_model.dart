/// Premium Abonelik Modeli
class PremiumSubscriptionModel {
  final String id;
  final String planType;
  final String status;
  final DateTime startedAt;
  final DateTime? expiresAt;
  final bool autoRenew;
  final String? paymentProvider;
  final DateTime createdAt;
  final bool isActive;

  const PremiumSubscriptionModel({
    required this.id,
    required this.planType,
    required this.status,
    required this.startedAt,
    this.expiresAt,
    required this.autoRenew,
    this.paymentProvider,
    required this.createdAt,
    required this.isActive,
  });

  factory PremiumSubscriptionModel.fromMap(Map<String, dynamic> map) {
    return PremiumSubscriptionModel(
      id: map['id'] as String,
      planType: map['planType'] as String? ?? 'monthly',
      status: map['status'] as String? ?? 'inactive',
      startedAt: DateTime.parse(map['startedAt'] as String),
      expiresAt: map['expiresAt'] != null
          ? DateTime.parse(map['expiresAt'] as String)
          : null,
      autoRenew: map['autoRenew'] as bool? ?? false,
      paymentProvider: map['paymentProvider'] as String?,
      createdAt: DateTime.parse(map['createdAt'] as String),
      isActive: map['isActive'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'planType': planType,
      'status': status,
      'startedAt': startedAt.toIso8601String(),
      'expiresAt': expiresAt?.toIso8601String(),
      'autoRenew': autoRenew,
      'paymentProvider': paymentProvider,
      'createdAt': createdAt.toIso8601String(),
      'isActive': isActive,
    };
  }
}
