import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:dio/dio.dart';
import 'package:share_plus/share_plus.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/config/api_config.dart';

class CampaignDetailScreen extends StatefulWidget {
  final String title;
  final String description;
  final String detailText;
  final Color logoColor;
  final String? affiliateUrl;
  final String campaignId;
  final String originalUrl;

  const CampaignDetailScreen({
    super.key,
    required this.title,
    required this.description,
    required this.detailText,
    required this.logoColor,
    this.affiliateUrl,
    required this.campaignId,
    required this.originalUrl,
  });

  @override
  State<CampaignDetailScreen> createState() => _CampaignDetailScreenState();
}

class _CampaignDetailScreenState extends State<CampaignDetailScreen> {

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
                    ],
                  ),
                ),
              ),
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
}
