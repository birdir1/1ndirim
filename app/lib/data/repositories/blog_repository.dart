import '../../core/utils/network_result.dart';
import '../models/blog_category_model.dart';
import '../models/blog_post_model.dart';
import '../datasources/blog_api_datasource.dart';

/// Blog Repository
class BlogRepository {
  static final BlogRepository _instance = BlogRepository._internal();
  factory BlogRepository() => _instance;
  BlogRepository._internal();

  final BlogApiDataSource _apiDataSource = BlogApiDataSource();

  /// Blog kategorilerini getirir
  Future<NetworkResult<List<BlogCategoryModel>>> getCategories() async {
    try {
      final categories = await _apiDataSource.getCategories();
      return NetworkSuccess(categories);
    } catch (e) {
      final errorMessage = e is Exception
          ? e.toString().replaceFirst('Exception: ', '')
          : 'Blog kategorileri yüklenirken bir hata oluştu';

      return NetworkError.general(
        errorMessage,
        error: e,
      );
    }
  }

  /// Blog yazılarını getirir
  Future<NetworkResult<List<BlogPostModel>>> getPosts({
    String? categorySlug,
    bool featured = false,
    int limit = 10,
    int offset = 0,
  }) async {
    try {
      final posts = await _apiDataSource.getPosts(
        categorySlug: categorySlug,
        featured: featured,
        limit: limit,
        offset: offset,
      );
      return NetworkSuccess(posts);
    } catch (e) {
      final errorMessage = e is Exception
          ? e.toString().replaceFirst('Exception: ', '')
          : 'Blog yazıları yüklenirken bir hata oluştu';

      return NetworkError.general(
        errorMessage,
        error: e,
      );
    }
  }

  /// Belirli bir blog yazısını getirir
  Future<NetworkResult<BlogPostModel>> getPost(String slug) async {
    try {
      final post = await _apiDataSource.getPost(slug);
      return NetworkSuccess(post);
    } catch (e) {
      final errorMessage = e is Exception
          ? e.toString().replaceFirst('Exception: ', '')
          : 'Blog yazısı yüklenirken bir hata oluştu';

      return NetworkError.general(
        errorMessage,
        error: e,
      );
    }
  }
}
