/// Blog Kategorisi Modeli
class BlogCategoryModel {
  final String id;
  final String name;
  final String slug;
  final String? description;
  final String? iconName;
  final String? color;
  final int displayOrder;

  const BlogCategoryModel({
    required this.id,
    required this.name,
    required this.slug,
    this.description,
    this.iconName,
    this.color,
    required this.displayOrder,
  });

  /// Map'ten model oluşturur
  factory BlogCategoryModel.fromMap(Map<String, dynamic> map) {
    return BlogCategoryModel(
      id: map['id'] as String,
      name: map['name'] as String,
      slug: map['slug'] as String,
      description: map['description'] as String?,
      iconName: map['iconName'] as String?,
      color: map['color'] as String?,
      displayOrder: map['displayOrder'] as int? ?? 0,
    );
  }

  /// Model'den Map'e çevirir
  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'slug': slug,
      'description': description,
      'iconName': iconName,
      'color': color,
      'displayOrder': displayOrder,
    };
  }
}
