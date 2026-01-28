import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_svg/flutter_svg.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../data/models/source_model.dart';

/// Banka/Operatör seçim gridi
class SourceSelectionGrid extends StatelessWidget {
  final List<SourceModel> sources;
  final Function(String) onToggle;
  final bool isDark;
  final int crossAxisCount;

  const SourceSelectionGrid({
    super.key,
    required this.sources,
    required this.onToggle,
    this.isDark = false,
    this.crossAxisCount = 3,
  });

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      padding: EdgeInsets.zero,
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: crossAxisCount,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 1.9, // Overflow'u önlemek için daha yüksek kartlar (17px overflow'u çözmek için)
      ),
      itemCount: sources.length,
      itemBuilder: (context, index) {
        final source = sources[index];
        return RepaintBoundary(
          child: _SourceCard(
            source: source,
            isDark: isDark,
            onTap: () => onToggle(source.id),
          ),
        );
      },
    );
  }
}

class _SourceCard extends StatelessWidget {
  final SourceModel source;
  final bool isDark;
  final VoidCallback onTap;

  const _SourceCard({
    required this.source,
    required this.isDark,
    required this.onTap,
  });

  /// Logo görselini gösterir - görseldeki gibi gerçek logolar (PNG veya SVG)
  Widget _buildLogo(SourceModel source, {required bool isSelected}) {
    // Önce SVG'yi dene, yoksa PNG'yi dene
    final logoSvgPath = 'assets/images/logos/${source.id}.svg';
    final logoPngPath = 'assets/images/logos/${source.id}.png';
    
    return Container(
      width: double.infinity, // Tam genişlik
      height: 55, // Logo yüksekliği (overflow'u önlemek için 60'tan 55'e düşürüldü)
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3), // Padding optimize edildi
      decoration: BoxDecoration(
        // Şeffaf arka plan sorununu tamamen çözmek için tam beyaz arka plan
        color: Colors.white, // Her zaman beyaz arka plan
        borderRadius: BorderRadius.circular(8),
      ),
      child: Center(
        child: _buildLogoImage(logoSvgPath, logoPngPath, source, isSelected),
      ),
    );
  }

  /// Logo görselini yükler (SVG öncelikli, PNG fallback)
  Widget _buildLogoImage(String svgPath, String pngPath, SourceModel source, bool isSelected) {
    // Önce SVG dosyasının var olup olmadığını kontrol et
    // SVG yoksa direkt PNG'ye geç
    return FutureBuilder<String?>(
      future: _checkAssetExists(svgPath),
      builder: (context, snapshot) {
        // SVG dosyası varsa SVG göster
        if (snapshot.hasData && snapshot.data != null) {
          try {
            return Center(
              child: SvgPicture.asset(
                svgPath,
                fit: BoxFit.contain,
                semanticsLabel: '${source.name} logo',
                placeholderBuilder: (context) => _buildPngOrFallback(pngPath, source, isSelected),
                // allowDrawingOutsideViewBox: true, // SVG uyarılarını azaltır
              ),
            );
          } catch (e) {
            // SVG yükleme hatası durumunda PNG'ye geç (sessizce)
            return _buildPngOrFallback(pngPath, source, isSelected);
          }
        }
        // SVG yoksa direkt PNG'ye geç
        return _buildPngOrFallback(pngPath, source, isSelected);
      },
    );
  }

  /// Asset dosyasının var olup olmadığını kontrol eder
  Future<String?> _checkAssetExists(String path) async {
    try {
      await rootBundle.loadString(path);
      return path; // Dosya varsa path döndür
    } catch (e) {
      // SVG yoksa sessizce null döndür (PNG fallback kullanılacak)
      return null;
    }
  }

  /// PNG'yi dene, yoksa fallback icon göster
  Widget _buildPngOrFallback(String pngPath, SourceModel source, bool isSelected) {
    return Center(
      child: Image.asset(
        pngPath,
        fit: BoxFit.contain,
        filterQuality: FilterQuality.high,
        errorBuilder: (context, error, stackTrace) {
          // Logo yoksa fallback icon göster (sessizce)
          return _buildFallbackIcon(source, isSelected);
        },
      ),
    );
  }

  /// Fallback icon widget'ı
  Widget _buildFallbackIcon(SourceModel source, bool isSelected) {
    return Container(
      width: double.infinity,
      height: 55,
      decoration: BoxDecoration(
        color: isSelected
            ? Colors.white.withValues(alpha: 0.2)
            : source.color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Icon(
        source.icon,
        color: isSelected ? Colors.white : source.color,
        size: 32,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        // Card - görseldeki gibi beyaz, seçili olanlar pembe arka plan
        // Column kaldırıldı - direkt Container kullanılıyor (overflow'u önler)
        decoration: BoxDecoration(
          color: source.isSelected
              ? AppColors.primaryLight // Pembe arka plan (seçili)
              : Colors.white, // Beyaz arka plan (seçili değil)
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 4,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Stack(
          children: [
            // Logo ve isim - dikey düzen
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6), // Padding optimize edildi
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                mainAxisSize: MainAxisSize.min, // Minimum alan kullan
                children: [
                  // Logo - büyük ve üstte
                  _buildLogo(source, isSelected: source.isSelected),
                  const SizedBox(height: 3), // Logo ve text arası boşluk (4'ten 3'e düşürüldü)
                  // İsim - logo altında küçük
                  Text(
                    source.name,
                    style: AppTextStyles.body(isDark: isDark).copyWith(
                      fontSize: 10,
                      fontWeight: FontWeight.w500,
                      color: source.isSelected ? Colors.white : AppColors.textPrimaryLight,
                      height: 1.2, // Line height optimize edildi
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
            // Checkmark - sağ üstte (sadece seçili olanlarda)
            if (source.isSelected)
              Positioned(
                top: 6,
                right: 6,
                child: Container(
                  width: 18,
                  height: 18,
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    Icons.check,
                    color: AppColors.primaryLight, // Pembe checkmark
                    size: 12,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
