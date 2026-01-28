import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:dio/dio.dart';
import 'package:share_plus/share_plus.dart';
import 'package:intl/intl.dart';
import 'package:video_player/video_player.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/config/api_config.dart';
import '../../core/utils/network_result.dart';
import '../../data/repositories/comment_repository.dart';
import '../../data/repositories/rating_repository.dart';
import '../../data/repositories/price_tracking_repository.dart';
import '../../data/models/comment_model.dart';
import '../../data/models/rating_model.dart';
import '../../core/services/auth_service.dart';
import '../../core/utils/network_result.dart';

class CampaignDetailScreen extends StatefulWidget {
  final String title;
  final String description;
  final String detailText;
  final Color logoColor;
  final String? affiliateUrl;
  final String campaignId;
  final String originalUrl;
  final String? videoUrl;
  final String? videoThumbnailUrl;
  final int? videoDuration;

  const CampaignDetailScreen({
    super.key,
    required this.title,
    required this.description,
    required this.detailText,
    required this.logoColor,
    this.affiliateUrl,
    required this.campaignId,
    required this.originalUrl,
    this.videoUrl,
    this.videoThumbnailUrl,
    this.videoDuration,
  });

  /// OpportunityModel'den CampaignDetailScreen oluşturur
  factory CampaignDetailScreen.fromOpportunity({
    required opportunity,
  }) {
    return CampaignDetailScreen(
      title: opportunity.title,
      description: opportunity.subtitle,
      detailText: 'Bu kampanyayı kullanmak için ilgili kartınızla alışveriş yapmanız yeterli.',
      logoColor: opportunity.iconColor,
      affiliateUrl: opportunity.affiliateUrl,
      campaignId: opportunity.id,
      originalUrl: opportunity.originalUrl ?? '',
      videoUrl: opportunity.videoUrl,
      videoThumbnailUrl: opportunity.videoThumbnailUrl,
      videoDuration: opportunity.videoDuration,
    );
  }

  @override
  State<CampaignDetailScreen> createState() => _CampaignDetailScreenState();
}

class _CampaignDetailScreenState extends State<CampaignDetailScreen> {
  final CommentRepository _commentRepository = CommentRepository.instance;
  final RatingRepository _ratingRepository = RatingRepository.instance;
  final PriceTrackingRepository _priceTrackingRepository = PriceTrackingRepository.instance;
  final AuthService _authService = AuthService.instance;
  
  List<CommentModel> _comments = [];
  RatingModel? _ratingStats;
  NetworkResult<List<CommentModel>>? _commentsResult;
  NetworkResult<RatingModel>? _ratingResult;
  bool _isLoadingComments = false;
  bool _isLoadingRating = false;
  final TextEditingController _commentController = TextEditingController();
  int? _selectedRating;
  
  // Video player
  VideoPlayerController? _videoController;
  bool _isVideoInitialized = false;
  bool _isVideoPlaying = false;
  
  // Price tracking
  bool _isPriceTracking = false;
  bool _isLoadingPriceTracking = false;

  @override
  void initState() {
    super.initState();
    _commentController.addListener(() {
      setState(() {}); // Buton durumunu güncelle
    });
    _loadComments();
    _loadRatingStats();
    _initializeVideo();
    _checkPriceTracking();
  }

  Future<void> _checkPriceTracking() async {
    if (_authService.currentUser == null) return;

    try {
      final result = await _priceTrackingRepository.getPriceTracking();
      if (result is NetworkSuccess) {
        final tracking = result.data;
        setState(() {
          _isPriceTracking = tracking.any((t) => t.campaignId == widget.campaignId);
        });
      }
    } catch (e) {
      // Hata durumunda sessizce devam et
    }
  }

  Future<void> _togglePriceTracking() async {
    if (_authService.currentUser == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Fiyat takibi için giriş yapmanız gerekiyor'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    setState(() {
      _isLoadingPriceTracking = true;
    });

    NetworkResult result;
    if (_isPriceTracking) {
      result = await _priceTrackingRepository.removePriceTracking(widget.campaignId);
    } else {
      result = await _priceTrackingRepository.addPriceTracking(
        campaignId: widget.campaignId,
        notifyOnDrop: true,
        notifyOnIncrease: false,
      );
    }

    if (mounted) {
      setState(() {
        _isLoadingPriceTracking = false;
        if (result is NetworkSuccess) {
          _isPriceTracking = !_isPriceTracking;
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                _isPriceTracking
                    ? 'Fiyat takibi başlatıldı'
                    : 'Fiyat takibi durduruldu',
              ),
              backgroundColor: AppColors.success,
            ),
          );
        } else if (result is NetworkError) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(result.message),
              backgroundColor: AppColors.error,
            ),
          );
        }
      });
    }
  }

  @override
  void dispose() {
    _commentController.dispose();
    _videoController?.dispose();
    super.dispose();
  }

  /// Video player'ı başlat
  Future<void> _initializeVideo() async {
    if (widget.videoUrl == null || widget.videoUrl!.isEmpty) {
      return;
    }

    try {
      _videoController = VideoPlayerController.networkUrl(
        Uri.parse(widget.videoUrl!),
      );
      
      await _videoController!.initialize();
      
      if (mounted) {
        setState(() {
          _isVideoInitialized = true;
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Video yüklenemedi: ${e.toString()}'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  Future<void> _loadComments() async {
    setState(() {
      _isLoadingComments = true;
    });

    final result = await _commentRepository.getComments(
      campaignId: widget.campaignId,
      limit: 20,
    );

    setState(() {
      _commentsResult = result;
      _isLoadingComments = false;
      if (result is NetworkSuccess) {
        _comments = result.data;
      }
    });
  }

  Future<void> _loadRatingStats() async {
    setState(() {
      _isLoadingRating = true;
    });

    final result = await _ratingRepository.getRatingStats(widget.campaignId);

    setState(() {
      _ratingResult = result;
      _isLoadingRating = false;
      if (result is NetworkSuccess) {
        _ratingStats = result.data;
        _selectedRating = result.data.userRating;
      }
    });
  }

  Future<void> _submitComment() async {
    if (_commentController.text.trim().isEmpty) return;

    final commentText = _commentController.text.trim();
    _commentController.clear();

    final result = await _commentRepository.addComment(
      campaignId: widget.campaignId,
      commentText: commentText,
    );

    if (result is NetworkSuccess) {
      _loadComments();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Yorumunuz eklendi'),
            backgroundColor: AppColors.success,
            duration: Duration(seconds: 2),
          ),
        );
      }
    } else if (result is NetworkError && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result.message),
          backgroundColor: AppColors.error,
          duration: const Duration(seconds: 3),
        ),
      );
    }
  }

  Future<void> _submitRating(int rating) async {
    setState(() {
      _selectedRating = rating;
    });

    final result = await _ratingRepository.submitRating(
      campaignId: widget.campaignId,
      rating: rating,
    );

    if (result is NetworkSuccess) {
      _loadRatingStats();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Puanınız kaydedildi'),
            backgroundColor: AppColors.success,
            duration: Duration(seconds: 2),
          ),
        );
      }
    } else if (result is NetworkError && mounted) {
      setState(() {
        _selectedRating = _ratingStats?.userRating;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result.message),
          backgroundColor: AppColors.error,
          duration: const Duration(seconds: 3),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundLight, // #FFF2C6
      appBar: AppBar(
        backgroundColor: AppColors.backgroundLight,
        elevation: 0,
        leading: IconButton(
          icon: Icon(
            Icons.arrow_back_ios_new,
            color: AppColors.textPrimaryLight, // #1F2937
            size: 20,
          ),
          onPressed: () => Navigator.of(context).pop(),
        ),
        actions: [
          IconButton(
            icon: Icon(
              Icons.share_outlined,
              color: AppColors.textPrimaryLight,
              size: 24,
            ),
            onPressed: _shareCampaign,
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          child: Column(
            children: [
              // Büyük Beyaz Card
              Container(
                width: double.infinity,
                decoration: BoxDecoration(
                  color: AppColors.cardBackground, // White
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.textPrimaryLight.withOpacity(0.08),
                      blurRadius: 16,
                      offset: const Offset(0, 4),
                      spreadRadius: 0,
                    ),
                  ],
                ),
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Kampanya Özet Bölümü
                      _buildCampaignSummary(),
                      
                      const SizedBox(height: 32),
                      
                      // Video Bölümü (varsa)
                      if (widget.videoUrl != null && widget.videoUrl!.isNotEmpty)
                        _buildVideoSection(),
                      
                      if (widget.videoUrl != null && widget.videoUrl!.isNotEmpty)
                        const SizedBox(height: 32),
                      
                      // Kampanya Detayları Bölümü
                      _buildCampaignDetails(),
                      
                      const SizedBox(height: 32),
                      
                      // Nasıl Kullanılır Bölümü
                      _buildHowToUse(),
                      
                      const SizedBox(height: 32),
                      
                      // Geçerlilik Bölümü
                      _buildValidity(),
                      
                      const SizedBox(height: 32),
                      
                      // CTA Butonu
                      _buildCTAButton(),
                      
                      const SizedBox(height: 12),
                      
                      // Fiyat Takibi Butonu
                      _buildPriceTrackingButton(),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 20),

              // Puanlama Bölümü
              _buildRatingSection(),

              const SizedBox(height: 20),

              // Yorumlar Bölümü
              _buildCommentsSection(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCampaignSummary() {
    return Column(
      children: [
        // Marka / Kampanya Görseli
        Center(
          child: Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: widget.logoColor.withOpacity(0.15),
              shape: BoxShape.circle,
              border: Border.all(
                color: widget.logoColor.withOpacity(0.3),
                width: 2,
              ),
            ),
            child: Icon(
              Icons.play_circle_filled,
              color: widget.logoColor,
              size: 40,
            ),
          ),
        ),
        const SizedBox(height: 20),
        
        // Kampanya Başlığı
        Text(
          widget.title,
          style: AppTextStyles.headline(isDark: false),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 8),
        
        // Alt Başlık
        Text(
          widget.description,
          style: AppTextStyles.bodySecondary(isDark: false),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  Widget _buildCampaignDetails() {
    // detailText'i satırlara böl (örnek format için)
    final details = widget.detailText.split('\n').where((line) => line.trim().isNotEmpty).toList();
    if (details.isEmpty) {
      details.add(widget.detailText);
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Bölüm Başlığı
        Text(
          'KAMPANYA DETAYLARI',
          style: AppTextStyles.bodySecondary(isDark: false).copyWith(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            letterSpacing: 0.5,
            color: AppColors.textSecondaryLight,
          ),
        ),
        const SizedBox(height: 16),
        
        // Check İkonlu Maddeler
        ...details.map((detail) => Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 24,
                height: 24,
                decoration: BoxDecoration(
                  color: AppColors.primaryLight,
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.check,
                  color: AppColors.cardBackground,
                  size: 16,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  detail.trim(),
                  style: AppTextStyles.body(isDark: false),
                ),
              ),
            ],
          ),
        )),
      ],
    );
  }

  Widget _buildHowToUse() {
    // Örnek adımlar (gerçek uygulamada parametre olarak geçilebilir)
    final steps = [
      'Yapı Kredi Mobil > Kampanyalar menüsünden "Katıl" butonuna tıklayın.',
      'Netflix ödemenizi kayıtlı Yapı Kredi kartınız ile yapın.',
      'İade tutarı bir sonraki ekstrenize yansıtılacaktır.',
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Bölüm Başlığı
        Text(
          'NASIL KULLANILIR?',
          style: AppTextStyles.bodySecondary(isDark: false).copyWith(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            letterSpacing: 0.5,
            color: AppColors.textSecondaryLight,
          ),
        ),
        const SizedBox(height: 16),
        
        // Numaralı Adımlar
        ...steps.asMap().entries.map((entry) {
          final index = entry.key + 1;
          final step = entry.value;
          return Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 28,
                  height: 28,
                  decoration: BoxDecoration(
                    color: AppColors.primaryLight,
                    shape: BoxShape.circle,
                  ),
                  child: Center(
                    child: Text(
                      '$index',
                      style: AppTextStyles.body(isDark: false).copyWith(
                        color: AppColors.cardBackground,
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    step,
                    style: AppTextStyles.body(isDark: false),
                  ),
                ),
              ],
            ),
          );
        }),
      ],
    );
  }

  Widget _buildValidity() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Bölüm Başlığı
        Text(
          'GEÇERLİLİK',
          style: AppTextStyles.bodySecondary(isDark: false).copyWith(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            letterSpacing: 0.5,
            color: AppColors.textSecondaryLight,
          ),
        ),
        const SizedBox(height: 16),
        
        // Chip'ler
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            // Tarih Çipi
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: AppColors.cardBackground,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: AppColors.textSecondaryLight.withOpacity(0.3),
                  width: 1,
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.calendar_today,
                    size: 14,
                    color: AppColors.textSecondaryLight,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    '30 Kasım\'a kadar',
                    style: AppTextStyles.bodySecondary(isDark: false).copyWith(
                      fontSize: 13,
                    ),
                  ),
                ],
              ),
            ),
            
            // Kanal Çipi
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: AppColors.primaryLight,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                'Online',
                style: AppTextStyles.bodySecondary(isDark: false).copyWith(
                  fontSize: 13,
                  color: AppColors.cardBackground,
                ),
              ),
            ),
            
            // Durum Çipi
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: AppColors.opportunityGreenLight,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                'Aktif',
                style: AppTextStyles.bodySecondary(isDark: false).copyWith(
                  fontSize: 13,
                  color: AppColors.success,
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildVideoSection() {
    if (!_isVideoInitialized || _videoController == null) {
      // Video yükleniyor veya thumbnail göster
      return Container(
        width: double.infinity,
        height: 200,
        decoration: BoxDecoration(
          color: AppColors.surfaceLight,
          borderRadius: BorderRadius.circular(16),
        ),
        child: widget.videoThumbnailUrl != null && widget.videoThumbnailUrl!.isNotEmpty
            ? ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: Image.network(
                  widget.videoThumbnailUrl!,
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) {
                    return Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.play_circle_outline,
                            size: 48,
                            color: AppColors.textSecondaryLight,
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Video yükleniyor...',
                            style: AppTextStyles.caption(isDark: false).copyWith(
                              color: AppColors.textSecondaryLight,
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              )
            : Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.play_circle_outline,
                      size: 48,
                      color: AppColors.textSecondaryLight,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Video yükleniyor...',
                      style: AppTextStyles.caption(isDark: false).copyWith(
                        color: AppColors.textSecondaryLight,
                      ),
                    ),
                  ],
                ),
              ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Kampanya Videosu',
          style: AppTextStyles.body(isDark: false).copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),
        Container(
          width: double.infinity,
          height: 200,
          decoration: BoxDecoration(
            color: Colors.black,
            borderRadius: BorderRadius.circular(16),
          ),
          child: Stack(
            alignment: Alignment.center,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: AspectRatio(
                  aspectRatio: _videoController!.value.aspectRatio,
                  child: VideoPlayer(_videoController!),
                ),
              ),
              // Play/Pause butonu
              IconButton(
                icon: Icon(
                  _isVideoPlaying ? Icons.pause_circle : Icons.play_circle,
                  size: 64,
                  color: Colors.white.withOpacity(0.9),
                ),
                onPressed: () {
                  setState(() {
                    if (_videoController!.value.isPlaying) {
                      _videoController!.pause();
                      _isVideoPlaying = false;
                    } else {
                      _videoController!.play();
                      _isVideoPlaying = true;
                    }
                  });
                },
              ),
            ],
          ),
        ),
        if (widget.videoDuration != null)
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Text(
              'Süre: ${_formatDuration(widget.videoDuration!)}',
              style: AppTextStyles.caption(isDark: false).copyWith(
                color: AppColors.textSecondaryLight,
              ),
            ),
          ),
      ],
    );
  }

  String _formatDuration(int seconds) {
    final duration = Duration(seconds: seconds);
    final minutes = duration.inMinutes;
    final remainingSeconds = duration.inSeconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${remainingSeconds.toString().padLeft(2, '0')}';
  }

  Widget _buildPriceTrackingButton() {
    if (_authService.currentUser == null) {
      return const SizedBox.shrink();
    }

    return OutlinedButton.icon(
      onPressed: _isLoadingPriceTracking ? null : _togglePriceTracking,
      icon: _isLoadingPriceTracking
          ? const SizedBox(
              width: 16,
              height: 16,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: AppColors.primaryLight,
              ),
            )
          : Icon(
              _isPriceTracking ? Icons.track_changes : Icons.track_changes_outlined,
              color: _isPriceTracking ? AppColors.primaryLight : AppColors.textSecondaryLight,
            ),
      label: Text(
        _isPriceTracking ? 'Fiyat Takibi Aktif' : 'Fiyat Takibini Başlat',
        style: AppTextStyles.body(isDark: false).copyWith(
          color: _isPriceTracking ? AppColors.primaryLight : AppColors.textSecondaryLight,
        ),
      ),
      style: OutlinedButton.styleFrom(
        padding: const EdgeInsets.symmetric(vertical: 14),
        side: BorderSide(
          color: _isPriceTracking
              ? AppColors.primaryLight
              : AppColors.textSecondaryLight.withOpacity(0.3),
          width: 1.5,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        backgroundColor: _isPriceTracking
            ? AppColors.primaryLight.withOpacity(0.1)
            : Colors.transparent,
      ),
    );
  }

  Widget _buildCTAButton() {
    return SizedBox(
      width: double.infinity,
      height: 56,
      child: ElevatedButton(
        onPressed: () async {
          await _handleCampaignClick();
        },
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primaryLight, // #8CA9FF
          foregroundColor: AppColors.textPrimaryLight, // #1F2937
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              'Kampanyaya Git',
              style: AppTextStyles.button(color: AppColors.textPrimaryLight),
            ),
            const SizedBox(width: 8),
            Icon(
              Icons.open_in_new,
              size: 18,
              color: AppColors.textPrimaryLight,
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _handleCampaignClick() async {
    try {
      // 1. Backend'e click event gönder
      final redirectUrl = await _trackCampaignClick();
      
      if (redirectUrl == null || redirectUrl.isEmpty) {
        // Backend down veya URL yok, fallback kullan
        _openCampaignUrlFallback();
        return;
      }
      
      // 2. URL'yi aç
      await _openUrl(redirectUrl);
      
    } catch (e) {
      // Hata durumunda fallback URL'yi aç
      _openCampaignUrlFallback();
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Bir hata oluştu, kampanya sayfasına yönlendiriliyorsunuz'),
            backgroundColor: AppColors.warning,
            duration: const Duration(seconds: 2),
          ),
        );
      }
    }
  }

  Future<String?> _trackCampaignClick() async {
    try {
      final dio = Dio(BaseOptions(
        baseUrl: ApiConfig.baseUrl,
        connectTimeout: ApiConfig.connectTimeout,
        receiveTimeout: ApiConfig.receiveTimeout,
      ));
      
      final response = await dio.post(
        '${ApiConfig.campaigns}/${widget.campaignId}/click',
        data: {}, // Boş body (sadeleştirilmiş)
      );
      
      if (response.statusCode == 200 && response.data['success'] == true) {
        final data = response.data['data'] as Map<String, dynamic>?;
        return data?['redirectUrl'] as String?;
      }
      
      return null;
    } catch (e) {
      // Backend down veya network error → null döner, fallback kullanılır
      return null;
    }
  }

  Future<void> _openUrl(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else {
      throw Exception('URL açılamadı: $url');
    }
  }

  void _openCampaignUrlFallback() {
    // Fallback: affiliateUrl varsa onu kullan, yoksa originalUrl
    final url = widget.affiliateUrl ?? widget.originalUrl;
    if (url.isNotEmpty) {
      _openUrl(url);
    }
  }

  /// Kampanyayı paylaşır
  Future<void> _shareCampaign() async {
    try {
      // Paylaşılacak URL (affiliate varsa onu kullan, yoksa original)
      final shareUrl = widget.affiliateUrl ?? widget.originalUrl;
      
      // Paylaşım metni oluştur
      final shareText = '''${widget.title}

${widget.description}

${shareUrl}

1ndirim ile keşfet''';

      // Native share sheet'i aç
      await Share.share(
        shareText,
        subject: widget.title,
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Paylaşım sırasında bir hata oluştu'),
            backgroundColor: AppColors.error,
            duration: const Duration(seconds: 2),
          ),
        );
      }
    }
  }

  /// Puanlama bölümü
  Widget _buildRatingSection() {
    final isLoggedIn = _authService.getCurrentFirebaseUser() != null;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AppColors.cardBackground,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: AppColors.textPrimaryLight.withOpacity(0.08),
            blurRadius: 16,
            offset: const Offset(0, 4),
            spreadRadius: 0,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'PUANLAMA',
            style: AppTextStyles.bodySecondary(isDark: false).copyWith(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              letterSpacing: 0.5,
              color: AppColors.textSecondaryLight,
            ),
          ),
          const SizedBox(height: 16),
          
          if (_isLoadingRating)
            const Center(
              child: Padding(
                padding: EdgeInsets.all(16.0),
                child: CircularProgressIndicator(),
              ),
            )
          else if (_ratingResult is NetworkError)
            Text(
              (_ratingResult as NetworkError).message,
              style: AppTextStyles.bodySecondary(isDark: false),
            )
          else if (_ratingStats != null) ...[
            // Ortalama puan
            Row(
              children: [
                Text(
                  _ratingStats!.averageRating.toStringAsFixed(1),
                  style: AppTextStyles.headline(isDark: false).copyWith(
                    fontSize: 32,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(width: 8),
                _buildStarRating(_ratingStats!.averageRating, size: 24),
                const SizedBox(width: 8),
                Text(
                  '(${_ratingStats!.totalRatings} değerlendirme)',
                  style: AppTextStyles.bodySecondary(isDark: false),
                ),
              ],
            ),
            const SizedBox(height: 16),
            
            // Kullanıcı puanı (eğer giriş yapmışsa)
            if (isLoggedIn) ...[
              const Divider(),
              const SizedBox(height: 16),
              Text(
                'Puanınız',
                style: AppTextStyles.body(isDark: false).copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 8),
              _buildStarRatingInput(),
            ],
          ],
        ],
      ),
    );
  }

  /// Yıldız puanlama widget'ı (görüntüleme)
  Widget _buildStarRating(double rating, {double size = 20}) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(5, (index) {
        final starValue = index + 1;
        if (rating >= starValue) {
          return Icon(Icons.star, color: AppColors.warning, size: size);
        } else if (rating > starValue - 1) {
          return Icon(Icons.star_half, color: AppColors.warning, size: size);
        } else {
          return Icon(Icons.star_border, color: AppColors.textSecondaryLight, size: size);
        }
      }),
    );
  }

  /// Yıldız puanlama widget'ı (input)
  Widget _buildStarRatingInput() {
    return Row(
      children: List.generate(5, (index) {
        final starValue = index + 1;
        final isSelected = _selectedRating != null && starValue <= _selectedRating!;
        
        return GestureDetector(
          onTap: () => _submitRating(starValue),
          child: Icon(
            isSelected ? Icons.star : Icons.star_border,
            color: isSelected ? AppColors.warning : AppColors.textSecondaryLight,
            size: 32,
          ),
        );
      }),
    );
  }

  /// Yorumlar bölümü
  Widget _buildCommentsSection() {
    final isLoggedIn = _authService.getCurrentFirebaseUser() != null;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AppColors.cardBackground,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: AppColors.textPrimaryLight.withOpacity(0.08),
            blurRadius: 16,
            offset: const Offset(0, 4),
            spreadRadius: 0,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'YORUMLAR',
            style: AppTextStyles.bodySecondary(isDark: false).copyWith(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              letterSpacing: 0.5,
              color: AppColors.textSecondaryLight,
            ),
          ),
          const SizedBox(height: 16),
          
          // Yorum ekleme alanı (giriş yapmışsa)
          if (isLoggedIn) ...[
            TextField(
              controller: _commentController,
              maxLines: 3,
              decoration: InputDecoration(
                hintText: 'Yorumunuzu yazın...',
                hintStyle: AppTextStyles.bodySecondary(isDark: false),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(
                    color: AppColors.textSecondaryLight.withOpacity(0.3),
                  ),
                ),
                filled: true,
                fillColor: AppColors.backgroundLight,
              ),
              style: AppTextStyles.body(isDark: false),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _commentController.text.trim().isEmpty ? null : _submitComment,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primaryLight,
                  foregroundColor: AppColors.textPrimaryLight,
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: const Text('Yorum Ekle'),
              ),
            ),
            const SizedBox(height: 24),
            const Divider(),
            const SizedBox(height: 16),
          ] else ...[
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.backgroundLight,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  Icon(Icons.info_outline, color: AppColors.textSecondaryLight, size: 20),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Yorum yapmak için giriş yapın',
                      style: AppTextStyles.bodySecondary(isDark: false),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
          ],
          
          // Yorumlar listesi
          if (_isLoadingComments)
            const Center(
              child: Padding(
                padding: EdgeInsets.all(16.0),
                child: CircularProgressIndicator(),
              ),
            )
          else if (_commentsResult is NetworkError)
            Text(
              (_commentsResult as NetworkError).message,
              style: AppTextStyles.bodySecondary(isDark: false),
            )
          else if (_comments.isEmpty)
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Text(
                'Henüz yorum yok. İlk yorumu siz yapın!',
                style: AppTextStyles.bodySecondary(isDark: false),
                textAlign: TextAlign.center,
              ),
            )
          else
            ..._comments.map((comment) => _buildCommentItem(comment)),
        ],
      ),
    );
  }

  /// Yorum item widget'ı
  Widget _buildCommentItem(CommentModel comment) {
    final dateFormat = DateFormat('dd MMM yyyy, HH:mm', 'tr_TR');
    
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 16,
                backgroundColor: AppColors.primaryLight.withOpacity(0.2),
                child: Text(
                  comment.userId.substring(0, 1).toUpperCase(),
                  style: AppTextStyles.body(isDark: false).copyWith(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Kullanıcı ${comment.userId.substring(0, 8)}',
                      style: AppTextStyles.body(isDark: false).copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    Text(
                      dateFormat.format(comment.createdAt) + (comment.isEdited ? ' (düzenlendi)' : ''),
                      style: AppTextStyles.caption(isDark: false).copyWith(
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ),
              if (comment.isOwnComment)
                PopupMenuButton(
                  icon: const Icon(Icons.more_vert, size: 18),
                  itemBuilder: (context) => [
                    const PopupMenuItem(
                      value: 'edit',
                      child: Text('Düzenle'),
                    ),
                    const PopupMenuItem(
                      value: 'delete',
                      child: Text('Sil'),
                    ),
                  ],
                  onSelected: (value) {
                    if (value == 'delete') {
                      _deleteComment(comment.id);
                    }
                  },
                ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            comment.commentText,
            style: AppTextStyles.body(isDark: false),
          ),
        ],
      ),
    );
  }

  Future<void> _deleteComment(String commentId) async {
    final result = await _commentRepository.deleteComment(commentId);
    
    if (result is NetworkSuccess) {
      _loadComments();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Yorum silindi'),
            backgroundColor: AppColors.success,
            duration: Duration(seconds: 2),
          ),
        );
      }
    } else if (result is NetworkError && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result.message),
          backgroundColor: AppColors.error,
          duration: const Duration(seconds: 3),
        ),
      );
    }
  }
}
