import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:share_plus/share_plus.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../data/models/blog_post_model.dart';

/// Blog Detay Ekranı
/// Blog yazısının tam içeriğini gösterir
class BlogDetailScreen extends StatelessWidget {
  final BlogPostModel post;

  const BlogDetailScreen({
    super.key,
    required this.post,
  });

  Future<void> _sharePost(BuildContext context) async {
    try {
      await Share.share(
        '${post.title}\n\n${post.excerpt ?? ''}\n\n1ndirim Blog',
      );
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Paylaşım hatası: ${e.toString()}'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      appBar: AppBar(
        backgroundColor: AppColors.backgroundLight,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.textPrimaryLight),
          onPressed: () => Navigator.of(context).pop(),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.share_outlined, color: AppColors.textPrimaryLight),
            onPressed: () => _sharePost(context),
            tooltip: 'Paylaş',
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Featured Image
            if (post.featuredImageUrl != null && post.featuredImageUrl!.isNotEmpty)
              Image.network(
                post.featuredImageUrl!,
                width: double.infinity,
                height: 250,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) {
                  return Container(
                    height: 250,
                    color: AppColors.surfaceLight,
                    child: Icon(
                      Icons.image_not_supported,
                      size: 48,
                      color: AppColors.textSecondaryLight,
                    ),
                  );
                },
              ),

            // Content
            Container(
              width: double.infinity,
              margin: const EdgeInsets.all(20),
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: AppColors.cardBackground,
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.shadowDark.withOpacity(0.1),
                    blurRadius: 12,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Kategori ve Tarih
                  Row(
                    children: [
                      if (post.category != null) ...[
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: post.category!.color != null
                                ? Color(int.parse(
                                    post.category!.color!.replaceFirst('#', '0xFF')))
                                : AppColors.primaryLight.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            post.category!.name,
                            style: AppTextStyles.caption(isDark: false).copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                      ],
                      if (post.publishedAt != null) ...[
                        Icon(
                          Icons.calendar_today,
                          size: 14,
                          color: AppColors.textSecondaryLight,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          DateFormat('dd MMMM yyyy', 'tr_TR')
                              .format(post.publishedAt!),
                          style: AppTextStyles.caption(isDark: false).copyWith(
                            color: AppColors.textSecondaryLight,
                          ),
                        ),
                      ],
                    ],
                  ),

                  const SizedBox(height: 20),

                  // Başlık
                  Text(
                    post.title,
                    style: AppTextStyles.headline(isDark: false).copyWith(
                      fontSize: 24,
                    ),
                  ),

                  if (post.excerpt != null && post.excerpt!.isNotEmpty) ...[
                    const SizedBox(height: 12),
                    Text(
                      post.excerpt!,
                      style: AppTextStyles.body(isDark: false).copyWith(
                        fontSize: 16,
                        color: AppColors.textSecondaryLight,
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                  ],

                  const SizedBox(height: 24),

                  // İçerik
                  _buildContent(post.content),

                  const SizedBox(height: 24),

                  // Footer
                  Divider(
                    color: AppColors.textSecondaryLight.withOpacity(0.2),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Icon(
                        Icons.person_outline,
                        size: 16,
                        color: AppColors.textSecondaryLight,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        post.authorName,
                        style: AppTextStyles.body(isDark: false).copyWith(
                          color: AppColors.textSecondaryLight,
                        ),
                      ),
                      const Spacer(),
                      Icon(
                        Icons.visibility_outlined,
                        size: 16,
                        color: AppColors.textSecondaryLight,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '${post.viewCount} görüntülenme',
                        style: AppTextStyles.caption(isDark: false).copyWith(
                          color: AppColors.textSecondaryLight,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContent(String content) {
    // Basit markdown parsing (başlıklar ve paragraflar)
    final lines = content.split('\n');
    final widgets = <Widget>[];

    for (final line in lines) {
      final trimmed = line.trim();
      if (trimmed.isEmpty) {
        widgets.add(const SizedBox(height: 16));
        continue;
      }

      if (trimmed.startsWith('# ')) {
        // H1
        widgets.add(
          Text(
            trimmed.substring(2),
            style: AppTextStyles.heading(isDark: false).copyWith(
              fontSize: 22,
            ),
          ),
        );
        widgets.add(const SizedBox(height: 12));
      } else if (trimmed.startsWith('## ')) {
        // H2
        widgets.add(
          Text(
            trimmed.substring(3),
            style: AppTextStyles.heading(isDark: false).copyWith(
              fontSize: 20,
            ),
          ),
        );
        widgets.add(const SizedBox(height: 10));
      } else if (trimmed.startsWith('### ')) {
        // H3
        widgets.add(
          Text(
            trimmed.substring(4),
            style: AppTextStyles.body(isDark: false).copyWith(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
        );
        widgets.add(const SizedBox(height: 8));
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        // Liste
        widgets.add(
          Padding(
            padding: const EdgeInsets.only(left: 16),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '• ',
                  style: AppTextStyles.body(isDark: false).copyWith(
                    fontSize: 18,
                  ),
                ),
                Expanded(
                  child: Text(
                    trimmed.substring(2),
                    style: AppTextStyles.body(isDark: false),
                  ),
                ),
              ],
            ),
          ),
        );
        widgets.add(const SizedBox(height: 8));
      } else {
        // Normal paragraf
        widgets.add(
          Text(
            trimmed,
            style: AppTextStyles.body(isDark: false).copyWith(
              height: 1.6,
            ),
          ),
        );
        widgets.add(const SizedBox(height: 12));
      }
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: widgets,
    );
  }
}
