import 'blog_category_model.dart';

/// Blog Yazısı Modeli
class BlogPostModel {
  final String id;
  final String title;
  final String slug;
  final String? excerpt;
  final String content;
  final String? featuredImageUrl;
  final String authorName;
  final int viewCount;
  final bool isFeatured;
  final DateTime? publishedAt;
  final DateTime createdAt;
  final BlogCategoryModel? category;

  const BlogPostModel({
    required this.id,
    required this.title,
    required this.slug,
    this.excerpt,
    required this.content,
    this.featuredImageUrl,
    required this.authorName,
    required this.viewCount,
    required this.isFeatured,
    this.publishedAt,
    required this.createdAt,
    this.category,
  });

  /// Map'ten model oluşturur
  factory BlogPostModel.fromMap(Map<String, dynamic> map) {
    return BlogPostModel(
      id: map['id'] as String,
      title: map['title'] as String,
      slug: map['slug'] as String,
      excerpt: map['excerpt'] as String?,
      content: map['content'] as String,
      featuredImageUrl: map['featuredImageUrl'] as String?,
      authorName: map['authorName'] as String? ?? '1ndirim Ekibi',
      viewCount: map['viewCount'] as int? ?? 0,
      isFeatured: map['isFeatured'] as bool? ?? false,
      publishedAt: map['publishedAt'] != null
          ? DateTime.parse(map['publishedAt'] as String)
          : null,
      createdAt: DateTime.parse(map['createdAt'] as String),
      category: map['category'] != null
          ? BlogCategoryModel.fromMap(map['category'] as Map<String, dynamic>)
          : null,
    );
  }

  /// Model'den Map'e çevirir
  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'title': title,
      'slug': slug,
      'excerpt': excerpt,
      'content': content,
      'featuredImageUrl': featuredImageUrl,
      'authorName': authorName,
      'viewCount': viewCount,
      'isFeatured': isFeatured,
      'publishedAt': publishedAt?.toIso8601String(),
      'createdAt': createdAt.toIso8601String(),
      'category': category?.toMap(),
    };
  }
}
