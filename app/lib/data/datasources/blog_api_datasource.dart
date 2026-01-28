import 'package:dio/dio.dart';
import '../../core/config/api_config.dart';
import '../../core/services/auth_service.dart';
import '../models/blog_category_model.dart';
import '../models/blog_post_model.dart';

/// Blog API Data Source
class BlogApiDataSource {
  final Dio _dio;
  final AuthService _authService = AuthService.instance;

  BlogApiDataSource({Dio? dio})
      : _dio = dio ??
            Dio(BaseOptions(
              baseUrl: ApiConfig.baseUrl,
              connectTimeout: ApiConfig.connectTimeout,
              receiveTimeout: ApiConfig.receiveTimeout,
            ));

  /// Auth header'ları alır (opsiyonel - blog herkese açık)
  Future<Map<String, String>> _getAuthHeaders() async {
    final token = await _authService.getIdToken();
    if (token == null) {
      return {}; // Giriş yapmamış kullanıcılar için boş header
    }
    return {
      'Authorization': 'Bearer $token',
    };
  }

  /// Blog kategorilerini getirir
  Future<List<BlogCategoryModel>> getCategories() async {
    try {
      final headers = await _getAuthHeaders();
      final response = await _dio.get(
        '/api/blog/categories',
        options: Options(headers: headers),
      );

      if (response.statusCode != 200) {
        throw Exception('Sunucu hatası (${response.statusCode})');
      }

      if (response.data == null || response.data['success'] != true) {
        throw Exception('Geçersiz yanıt');
      }

      final data = response.data['data'] as List?;
      if (data == null) {
        return [];
      }

      return data
          .map((item) => BlogCategoryModel.fromMap(item as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw Exception('Blog kategorileri yüklenirken bir hata oluştu: ${e.message}');
    } catch (e) {
      throw Exception('Blog kategorileri yüklenirken bir hata oluştu: ${e.toString()}');
    }
  }

  /// Blog yazılarını getirir
  Future<List<BlogPostModel>> getPosts({
    String? categorySlug,
    bool featured = false,
    int limit = 10,
    int offset = 0,
  }) async {
    try {
      final headers = await _getAuthHeaders();
      final queryParams = <String, dynamic>{
        'limit': limit,
        'offset': offset,
      };

      if (categorySlug != null) {
        queryParams['category'] = categorySlug;
      }

      if (featured) {
        queryParams['featured'] = 'true';
      }

      final response = await _dio.get(
        '/api/blog/posts',
        queryParameters: queryParams,
        options: Options(headers: headers),
      );

      if (response.statusCode != 200) {
        throw Exception('Sunucu hatası (${response.statusCode})');
      }

      if (response.data == null || response.data['success'] != true) {
        throw Exception('Geçersiz yanıt');
      }

      final data = response.data['data'] as List?;
      if (data == null) {
        return [];
      }

      return data
          .map((item) => BlogPostModel.fromMap(item as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw Exception('Blog yazıları yüklenirken bir hata oluştu: ${e.message}');
    } catch (e) {
      throw Exception('Blog yazıları yüklenirken bir hata oluştu: ${e.toString()}');
    }
  }

  /// Belirli bir blog yazısını getirir
  Future<BlogPostModel> getPost(String slug) async {
    try {
      final headers = await _getAuthHeaders();
      final response = await _dio.get(
        '/api/blog/posts/$slug',
        options: Options(headers: headers),
      );

      if (response.statusCode != 200) {
        throw Exception('Sunucu hatası (${response.statusCode})');
      }

      if (response.data == null || response.data['success'] != true) {
        throw Exception('Geçersiz yanıt');
      }

      return BlogPostModel.fromMap(response.data['data']);
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) {
        throw Exception('Blog yazısı bulunamadı');
      }
      throw Exception('Blog yazısı yüklenirken bir hata oluştu: ${e.message}');
    } catch (e) {
      throw Exception('Blog yazısı yüklenirken bir hata oluştu: ${e.toString()}');
    }
  }
}
