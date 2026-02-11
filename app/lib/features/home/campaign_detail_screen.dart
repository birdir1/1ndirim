import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:dio/dio.dart';
import 'package:share_plus/share_plus.dart';
import 'package:video_player/video_player.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/theme/brand_styles.dart';
import '../../core/config/api_config.dart';
import '../../core/utils/source_logo_helper.dart';
import '../../core/utils/date_formatter.dart';

class CampaignDetailScreen extends StatefulWidget {
  final String title;
  final String description;
  final String detailText;
  final Color logoColor;
  final String sourceName;
  final String? primaryTag;
  final String? affiliateUrl;
  final String campaignId;
  final String originalUrl;
  final String? videoUrl;
  final String? videoThumbnailUrl;
  final int? videoDuration;
  final String? expiresAt;

  const CampaignDetailScreen({
    super.key,
    required this.title,
    required this.description,
    required this.detailText,
    required this.logoColor,
    required this.sourceName,
    this.primaryTag,
    this.affiliateUrl,
    required this.campaignId,
    required this.originalUrl,
    this.videoUrl,
    this.videoThumbnailUrl,
    this.videoDuration,
    this.expiresAt,
  });

  /// OpportunityModel'den CampaignDetailScreen oluşturur
  factory CampaignDetailScreen.fromOpportunity({
    required dynamic opportunity,
    String? primaryTag,
  }) {
    final detail = (opportunity.detailText is String &&
            (opportunity.detailText as String).trim().isNotEmpty)
        ? (opportunity.detailText as String)
        : (opportunity.description is String &&
                (opportunity.description as String).trim().isNotEmpty)
            ? (opportunity.description as String)
            : (opportunity.subtitle?.isNotEmpty == true
                ? opportunity.subtitle
                : opportunity.title);

    final summary = (opportunity.description is String &&
            (opportunity.description as String).trim().isNotEmpty)
        ? (opportunity.description as String)
        : (opportunity.subtitle?.isNotEmpty == true
            ? opportunity.subtitle
            : opportunity.title);

    return CampaignDetailScreen(
      title: opportunity.title,
      description: summary,
      detailText: detail,
      logoColor: opportunity.iconColor,
      sourceName: opportunity.sourceName,
      primaryTag: primaryTag,
      affiliateUrl: opportunity.affiliateUrl,
      campaignId: opportunity.id,
      originalUrl: opportunity.originalUrl ?? '',
      videoUrl: opportunity.videoUrl,
      videoThumbnailUrl: opportunity.videoThumbnailUrl,
      videoDuration: opportunity.videoDuration,
      expiresAt: opportunity.expiresAt,
    );
  }

  @override
  State<CampaignDetailScreen> createState() => _CampaignDetailScreenState();
}

class _CampaignDetailScreenState extends State<CampaignDetailScreen> {
  // Video player
  VideoPlayerController? _videoController;
  bool _isVideoInitialized = false;
  bool _isVideoPlaying = false;

  @override
  void initState() {
    super.initState();
    _initializeVideo();
  }

  @override
  void dispose() {
    _videoController?.dispose();
    super.dispose();
  }

  /// Clean placeholder-like strings (e.g., "000 TL ...") that come from incomplete data.
  String _sanitizeText(String input) {
    var out = input.trim();
    // Remove leading "0... TL" tokens (000 TL, 0.000 TL, etc.)
    out = out.replaceAll(
      RegExp(r'^0[0-9\.]*\s*TL[^A-Za-z0-9]?', caseSensitive: false),
      '',
    );
    // Strip image filename artefacts
    out = out.replaceAll(RegExp(r'[_\\-][0-9]{2,4}x[0-9]{2,4}', caseSensitive: false), ' ');
    out = out.replaceAll(RegExp(r'\\.(jpg|jpeg|png|gif|webp)(\\?.*)?$', caseSensitive: false), '');
    out = out.replaceAll(RegExp(r'[\\-_]+'), ' ');
    if (RegExp(r'https?://', caseSensitive: false).hasMatch(out) ||
        RegExp(r'[a-z0-9]+_[a-z0-9]+', caseSensitive: false).hasMatch(out) ||
        RegExp(r'\\.com\\b', caseSensitive: false).hasMatch(out)) {
      return '';
    }
    // Remove leading bağlaç/ek kalıntıları
    out = out.replaceFirst(RegExp(r'^(nda|nde|nda\s+|nde\s+|ve\s+|ile\s+|da\s+|de\s+)', caseSensitive: false), '');
    // Strip common noise sentences (cookie notices, kampanya yok mesajları)
    final noisePatterns = [
      RegExp(r'çerez', caseSensitive: false),
      RegExp(r'cookie', caseSensitive: false),
      RegExp(r'kampanya bulunam', caseSensitive: false),
      RegExp(r'kriterlerde bir kampanya bulunamamıştır', caseSensitive: false),
      RegExp(r'sitemizden en iyi şekilde faydalan', caseSensitive: false),
      RegExp(r'©', caseSensitive: false),
      RegExp(r'copyright', caseSensitive: false),
      RegExp(r'vakıfbank', caseSensitive: false),
      RegExp(r'vakifbank', caseSensitive: false),
      RegExp(r'mtv kampanyasi', caseSensitive: false),
      RegExp(r'kisisel verilerin', caseSensitive: false),
      RegExp(r'kvkk', caseSensitive: false),
    ];
    for (final p in noisePatterns) {
      if (p.hasMatch(out)) return '';
    }
    // Collapse multiple spaces.
    out = out.replaceAll(RegExp(r'\\s+'), ' ');
    out = out.replaceAll(RegExp(r'\s{2,}'), ' ').trim();
    if (out.isNotEmpty) {
      out = out[0].toUpperCase() + out.substring(1);
    }
    return out.isEmpty ? input.trim() : out;
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      appBar: AppBar(
        backgroundColor: AppColors.backgroundLight,
        elevation: 0,
        leading: IconButton(
          icon: Icon(
            Icons.arrow_back_ios_new,
            color: AppColors.textPrimaryLight,
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
                  color: AppColors.cardBackground,
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.textPrimaryLight.withValues(alpha: 0.08),
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
                      if (widget.videoUrl != null &&
                          widget.videoUrl!.isNotEmpty)
                        _buildVideoSection(),

                      if (widget.videoUrl != null &&
                          widget.videoUrl!.isNotEmpty)
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
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }

  bool _isCustomerServiceText(String text) {
    final t = text.toLowerCase();
    // Remove "customer service" boilerplate from campaign details.
    return t.contains('müşteri hizmet') ||
        t.contains('musteri hizmet') ||
        t.contains('çağrı merkez') ||
        t.contains('cagri merkez') ||
        t.contains('call center') ||
        t.contains('customer service');
  }

  bool _isNoiseText(String text) {
    final t = text.toLowerCase();
    return t.contains('çerez') ||
        t.contains('cookie') ||
        t.contains('kampanya bulunam') ||
        t.contains('kriterlerde bir kampanya') ||
        t.contains('sitemizden en iyi şekilde faydalan');
  }

  Widget _buildCampaignSummary() {
    final brand = BrandStyles.getStyle(widget.sourceName);

    return Column(
      children: [
        // Marka / Kampanya Görseli
        Center(
          child: Container(
            width: 92,
            height: 92,
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              border: Border.all(
                color: brand.primary.withValues(alpha: 0.25),
                width: 2,
              ),
              boxShadow: [
                BoxShadow(
                  color: brand.primary.withValues(alpha: 0.12),
                  blurRadius: 14,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: SourceLogoHelper.getLogoWidget(
                widget.sourceName,
                width: 56,
                height: 56,
              ),
            ),
          ),
        ),
        const SizedBox(height: 20),

        // Kampanya Başlığı
        Text(
          widget.title,
          style: AppTextStyles.headline(
            isDark: false,
          ).copyWith(color: brand.primary),
          textAlign: TextAlign.center,
        ),
        if (widget.primaryTag != null &&
            widget.primaryTag!.toLowerCase() != 'banka' &&
            widget.primaryTag!.toLowerCase() != 'bankası' &&
            widget.primaryTag!.toLowerCase() != 'bankasi' &&
            widget.primaryTag!.toLowerCase() != 'operatör') ...[
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
            decoration: BoxDecoration(
              color: brand.primary.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: brand.primary.withValues(alpha: 0.15)),
            ),
            child: Text(
              widget.primaryTag!,
              style: AppTextStyles.caption(
                isDark: false,
              ).copyWith(color: brand.primary, fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildCampaignDetails() {
    // detailText'i satırlara böl
    final details = _sanitizeText(widget.detailText)
        .split('\n')
        .where((line) => line.trim().isNotEmpty)
        .where((line) => !_isCustomerServiceText(line))
        .where((line) =>
            line.toLowerCase() != widget.sourceName.toLowerCase() &&
            line.toLowerCase() != widget.title.toLowerCase())
        .where((line) => !_isNoiseText(line))
        .toList();
    if (details.isEmpty) {
      final fallback = _sanitizeText(
        widget.description.isNotEmpty ? widget.description : widget.title,
      );
      if (fallback.isNotEmpty &&
          fallback.toLowerCase() != widget.sourceName.toLowerCase()) {
        details.add(fallback);
      }
    }
    if (details.isEmpty) {
      details.add('Kampanya detayları yakında güncellenecek.');
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
        ...details.map(
          (detail) => Padding(
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
          ),
        ),
      ],
    );
  }

  Widget _buildHowToUse() {
    // Dinamik, marka agnostik adımlar
    final steps = [
      '${widget.sourceName} uygulamasında veya web sitesinde kampanyaya katılın.',
      'Uygun kart/hesap ile ödeme veya işlemi tamamlayın.',
      'Koşullar sağlanınca ödül/indirim otomatik tanımlanır.',
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
                  child: Text(step, style: AppTextStyles.body(isDark: false)),
                ),
              ],
            ),
          );
        }),
      ],
    );
  }

  Widget _buildValidity() {
    final expiresText = widget.expiresAt?.isNotEmpty == true
        ? formatDateTr(widget.expiresAt!)
        : 'Sürekli kampanya';

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
                  color: AppColors.textSecondaryLight.withValues(alpha: 0.3),
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
                    expiresText,
                    style: AppTextStyles.bodySecondary(
                      isDark: false,
                    ).copyWith(fontSize: 13),
                  ),
                ],
              ),
            ),

            // Gereksiz chipler kaldırıldı
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
        child:
            widget.videoThumbnailUrl != null &&
                widget.videoThumbnailUrl!.isNotEmpty
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
                            style: AppTextStyles.caption(
                              isDark: false,
                            ).copyWith(color: AppColors.textSecondaryLight),
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
                      style: AppTextStyles.caption(
                        isDark: false,
                      ).copyWith(color: AppColors.textSecondaryLight),
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
          style: AppTextStyles.body(
            isDark: false,
          ).copyWith(fontWeight: FontWeight.bold),
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
                  color: Colors.white.withValues(alpha: 0.9),
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
              style: AppTextStyles.caption(
                isDark: false,
              ).copyWith(color: AppColors.textSecondaryLight),
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

  Widget _buildCTAButton() {
    return SizedBox(
      width: double.infinity,
      height: 56,
      child: ElevatedButton(
        onPressed: () async {
          await _handleCampaignClick();
        },
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primaryLight,
          foregroundColor: AppColors.textPrimaryLight,
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
            content: const Text(
              'Bir hata oluştu, kampanya sayfasına yönlendiriliyorsunuz',
            ),
            backgroundColor: AppColors.warning,
            duration: const Duration(seconds: 2),
          ),
        );
      }
    }
  }

  Future<String?> _trackCampaignClick() async {
    try {
      final dio = Dio(
        BaseOptions(
          baseUrl: ApiConfig.baseUrl,
          connectTimeout: ApiConfig.connectTimeout,
          receiveTimeout: ApiConfig.receiveTimeout,
        ),
      );

      final response = await dio.post(
        '${ApiConfig.campaigns}/${widget.campaignId}/click',
        data: {},
      );

      if (response.statusCode == 200 && response.data['success'] == true) {
        final data = response.data['data'] as Map<String, dynamic>?;
        return data?['redirectUrl'] as String?;
      }

      return null;
    } catch (e) {
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
      final shareBody = _sanitizeText(
        widget.detailText.isNotEmpty ? widget.detailText : widget.description,
      );
      final shareText = '''${widget.title}

$shareBody

$shareUrl

1ndirim ile keşfet''';

      // Native share sheet'i aç
      await SharePlus.instance.share(
        ShareParams(text: shareText, subject: widget.title),
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
}
