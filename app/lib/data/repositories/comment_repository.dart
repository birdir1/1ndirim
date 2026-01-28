import '../datasources/comment_api_datasource.dart';
import '../models/comment_model.dart';
import '../../core/utils/network_result.dart';

/// Comment Repository
/// UI katmanı sadece bu repository üzerinden yorum verisi alır
class CommentRepository {
  final CommentApiDataSource _apiDataSource;

  // Singleton instance
  static CommentRepository? _instance;
  static CommentRepository get instance {
    _instance ??= CommentRepository._();
    return _instance!;
  }

  CommentRepository._() : _apiDataSource = CommentApiDataSource();

  /// Bir kampanyanın yorumlarını getirir
  Future<NetworkResult<List<CommentModel>>> getComments({
    required String campaignId,
    int? limit,
    int? offset,
  }) async {
    try {
      final comments = await _apiDataSource.getComments(
        campaignId: campaignId,
        limit: limit,
        offset: offset,
      );
      return NetworkSuccess(comments);
    } catch (e) {
      final errorMessage = e is Exception 
          ? e.toString().replaceFirst('Exception: ', '')
          : 'Yorumlar yüklenirken bir hata oluştu';
      
      return NetworkError.general(
        errorMessage,
        error: e,
      );
    }
  }

  /// Bir kampanyaya yorum ekler
  Future<NetworkResult<CommentModel>> addComment({
    required String campaignId,
    required String commentText,
  }) async {
    try {
      final comment = await _apiDataSource.addComment(
        campaignId: campaignId,
        commentText: commentText,
      );
      return NetworkSuccess(comment);
    } catch (e) {
      final errorMessage = e is Exception 
          ? e.toString().replaceFirst('Exception: ', '')
          : 'Yorum eklenirken bir hata oluştu';
      
      return NetworkError.general(
        errorMessage,
        error: e,
      );
    }
  }

  /// Bir yorumu günceller
  Future<NetworkResult<CommentModel>> updateComment({
    required String commentId,
    required String commentText,
  }) async {
    try {
      final comment = await _apiDataSource.updateComment(
        commentId: commentId,
        commentText: commentText,
      );
      return NetworkSuccess(comment);
    } catch (e) {
      final errorMessage = e is Exception 
          ? e.toString().replaceFirst('Exception: ', '')
          : 'Yorum güncellenirken bir hata oluştu';
      
      return NetworkError.general(
        errorMessage,
        error: e,
      );
    }
  }

  /// Bir yorumu siler
  Future<NetworkResult<void>> deleteComment(String commentId) async {
    try {
      await _apiDataSource.deleteComment(commentId);
      return const NetworkSuccess(null);
    } catch (e) {
      final errorMessage = e is Exception 
          ? e.toString().replaceFirst('Exception: ', '')
          : 'Yorum silinirken bir hata oluştu';
      
      return NetworkError.general(
        errorMessage,
        error: e,
      );
    }
  }
}
