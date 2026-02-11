import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

/// Image Service
///
/// Centralized image loading with caching, lazy loading, and optimization
class ImageService {
  /// Default placeholder
  static Widget defaultPlaceholder({double? width, double? height}) {
    return Container(
      width: width,
      height: height,
      color: Colors.grey[200],
      child: Center(
        child: Icon(Icons.image, color: Colors.grey[400], size: 40),
      ),
    );
  }

  /// Default error widget
  static Widget defaultErrorWidget({double? width, double? height}) {
    return Container(
      width: width,
      height: height,
      color: Colors.grey[100],
      child: Center(
        child: Icon(Icons.broken_image, color: Colors.grey[400], size: 40),
      ),
    );
  }

  /// Load network image with caching
  ///
  /// Features:
  /// - Automatic caching
  /// - Lazy loading
  /// - Placeholder while loading
  /// - Error handling
  /// - Memory optimization
  static Widget loadImage(
    String imageUrl, {
    double? width,
    double? height,
    BoxFit fit = BoxFit.cover,
    Widget? placeholder,
    Widget? errorWidget,
    BorderRadius? borderRadius,
    bool fadeIn = true,
    Duration fadeInDuration = const Duration(milliseconds: 300),
  }) {
    Widget imageWidget = CachedNetworkImage(
      imageUrl: imageUrl,
      width: width,
      height: height,
      fit: fit,
      placeholder: (context, url) =>
          placeholder ?? defaultPlaceholder(width: width, height: height),
      errorWidget: (context, url, error) =>
          errorWidget ?? defaultErrorWidget(width: width, height: height),
      fadeInDuration: fadeIn ? fadeInDuration : Duration.zero,
      memCacheWidth: width != null
          ? (width * 2).toInt()
          : null, // 2x for retina
      memCacheHeight: height != null ? (height * 2).toInt() : null,
    );

    if (borderRadius != null) {
      imageWidget = ClipRRect(borderRadius: borderRadius, child: imageWidget);
    }

    return imageWidget;
  }

  /// Load circular avatar image
  static Widget loadAvatar(
    String imageUrl, {
    double radius = 20,
    Widget? placeholder,
    Widget? errorWidget,
  }) {
    return CircleAvatar(
      radius: radius,
      backgroundColor: Colors.grey[200],
      child: ClipOval(
        child: CachedNetworkImage(
          imageUrl: imageUrl,
          width: radius * 2,
          height: radius * 2,
          fit: BoxFit.cover,
          placeholder: (context, url) =>
              placeholder ??
              Icon(Icons.person, size: radius, color: Colors.grey[400]),
          errorWidget: (context, url, error) =>
              errorWidget ??
              Icon(Icons.person, size: radius, color: Colors.grey[400]),
          memCacheWidth: (radius * 4).toInt(), // 2x for retina
          memCacheHeight: (radius * 4).toInt(),
        ),
      ),
    );
  }

  /// Load thumbnail image (optimized for small sizes)
  static Widget loadThumbnail(
    String imageUrl, {
    double size = 60,
    BoxFit fit = BoxFit.cover,
    BorderRadius? borderRadius,
  }) {
    return loadImage(
      imageUrl,
      width: size,
      height: size,
      fit: fit,
      borderRadius: borderRadius,
      fadeIn: false, // No fade for thumbnails
    );
  }

  /// Load hero image (optimized for large sizes)
  static Widget loadHeroImage(
    String imageUrl, {
    double? width,
    double? height,
    BoxFit fit = BoxFit.cover,
  }) {
    return loadImage(
      imageUrl,
      width: width,
      height: height,
      fit: fit,
      fadeIn: true,
      fadeInDuration: const Duration(milliseconds: 500),
    );
  }

  /// Preload image (for better UX)
  static Future<void> preloadImage(
    BuildContext context,
    String imageUrl,
  ) async {
    try {
      await precacheImage(CachedNetworkImageProvider(imageUrl), context);
    } catch (e) {
      // Ignore preload errors
      debugPrint('Image preload failed: $e');
    }
  }

  /// Preload multiple images
  static Future<void> preloadImages(
    BuildContext context,
    List<String> imageUrls,
  ) async {
    await Future.wait(imageUrls.map((url) => preloadImage(context, url)));
  }

  /// Clear image cache
  static Future<void> clearCache() async {
    await CachedNetworkImage.evictFromCache('');
  }

  /// Get cache size (approximate)
  static Future<int> getCacheSize() async {
    // This is an approximation
    // Actual implementation would require platform-specific code
    return 0;
  }
}

/// Lazy loading list view builder
///
/// Automatically loads images as they come into view
class LazyImageListView extends StatelessWidget {
  final int itemCount;
  final Widget Function(BuildContext context, int index) itemBuilder;
  final ScrollController? controller;
  final EdgeInsets? padding;

  const LazyImageListView({
    super.key,
    required this.itemCount,
    required this.itemBuilder,
    this.controller,
    this.padding,
  });

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      controller: controller,
      padding: padding,
      itemCount: itemCount,
      itemBuilder: itemBuilder,
      // Optimize for performance
      addAutomaticKeepAlives: false,
      addRepaintBoundaries: true,
      cacheExtent: 500, // Preload 500px ahead
    );
  }
}

/// Lazy loading grid view builder
class LazyImageGridView extends StatelessWidget {
  final int itemCount;
  final Widget Function(BuildContext context, int index) itemBuilder;
  final int crossAxisCount;
  final double mainAxisSpacing;
  final double crossAxisSpacing;
  final ScrollController? controller;
  final EdgeInsets? padding;

  const LazyImageGridView({
    super.key,
    required this.itemCount,
    required this.itemBuilder,
    this.crossAxisCount = 2,
    this.mainAxisSpacing = 8.0,
    this.crossAxisSpacing = 8.0,
    this.controller,
    this.padding,
  });

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      controller: controller,
      padding: padding,
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: crossAxisCount,
        mainAxisSpacing: mainAxisSpacing,
        crossAxisSpacing: crossAxisSpacing,
      ),
      itemCount: itemCount,
      itemBuilder: itemBuilder,
      // Optimize for performance
      addAutomaticKeepAlives: false,
      addRepaintBoundaries: true,
      cacheExtent: 500,
    );
  }
}
