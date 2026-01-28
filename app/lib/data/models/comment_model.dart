/// Kampanya Yorumu Modeli
class CommentModel {
  final String id;
  final String campaignId;
  final String userId;
  final String commentText;
  final DateTime createdAt;
  final DateTime updatedAt;
  final bool isEdited;
  final bool isOwnComment;

  const CommentModel({
    required this.id,
    required this.campaignId,
    required this.userId,
    required this.commentText,
    required this.createdAt,
    required this.updatedAt,
    required this.isEdited,
    required this.isOwnComment,
  });

  /// Map'ten model oluşturur
  factory CommentModel.fromMap(Map<String, dynamic> map) {
    return CommentModel(
      id: map['id'] as String,
      campaignId: map['campaignId'] as String,
      userId: map['userId'] as String,
      commentText: map['commentText'] as String,
      createdAt: DateTime.parse(map['createdAt'] as String),
      updatedAt: DateTime.parse(map['updatedAt'] as String),
      isEdited: map['isEdited'] as bool? ?? false,
      isOwnComment: map['isOwnComment'] as bool? ?? false,
    );
  }

  /// Model'den Map'e çevirir
  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'campaignId': campaignId,
      'userId': userId,
      'commentText': commentText,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'isEdited': isEdited,
      'isOwnComment': isOwnComment,
    };
  }
}
