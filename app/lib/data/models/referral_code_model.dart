/// Referral Code Model
class ReferralCodeModel {
  final String code;

  const ReferralCodeModel({required this.code});

  /// Map'ten model oluşturur
  factory ReferralCodeModel.fromMap(Map<String, dynamic> map) {
    return ReferralCodeModel(code: map['referralCode'] as String);
  }

  /// Model'den Map'e çevirir
  Map<String, dynamic> toMap() {
    return {'referralCode': code};
  }

  @override
  String toString() => 'ReferralCodeModel(code: $code)';

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is ReferralCodeModel && other.code == code;
  }

  @override
  int get hashCode => code.hashCode;
}
