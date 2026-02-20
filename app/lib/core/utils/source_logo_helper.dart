import 'package:flutter_svg/flutter_svg.dart';
import 'package:flutter/material.dart';

/// Source Logo Helper
/// Source name'den logo path'ini döndürür
class SourceLogoHelper {
  /// Source name'den logo asset path'ini döndürür
  static String? getLogoPath(String sourceName) {
    // Source name'i normalize et (küçük harf, boşlukları kaldır)
    final normalized = sourceName
        .toLowerCase()
        .replaceAll(' ', '')
        .replaceAll('ı', 'i')
        .replaceAll('ğ', 'g')
        .replaceAll('ü', 'u')
        .replaceAll('ş', 's')
        .replaceAll('ö', 'o')
        .replaceAll('ç', 'c');

    // Logo mapping
    final logoMap = {
      'akbank': 'assets/images/logos/akbank.svg',
      'albarakaturk': 'assets/images/logos/albarakaturk.png',
      'alternatifbank': 'assets/images/logos/alternatifbank.png',
      'anadolubank': 'assets/images/logos/anadolubank.svg',
      'bimcell': 'assets/images/logos/bimcell.png',
      'burganbank': 'assets/images/logos/burganbank.png',
      'cepteteb': 'assets/images/logos/cepteteb.png',
      'denizbank': 'assets/images/logos/denizbank.png',
      'emlakkatilim': 'assets/images/logos/emlakkatilim.png',
      'enpara': 'assets/images/logos/enpara.png',
      'fibabanka': 'assets/images/logos/fibabanka.png',
      'garanti': 'assets/images/logos/garanti.svg',
      'garantibbva': 'assets/images/logos/garanti.svg',
      'halkbank': 'assets/images/logos/halkbank.svg',
      'hayatfinans': 'assets/images/logos/hayatfinans.svg',
      'hsbc': 'assets/images/logos/hsbc.png',
      'icbc': 'assets/images/logos/icbc.png',
      'ingbank': 'assets/images/logos/ingbank.png',
      'ing': 'assets/images/logos/ingbank.png',
      'isbank': 'assets/images/logos/isbank.png',
      'isbankasi': 'assets/images/logos/isbank.png',
      'netflix': 'assets/images/logos/netflix.svg',
      'kuveytturk': 'assets/images/logos/kuveytturk.svg',
      'nkolay': 'assets/images/logos/nkolay.svg',
      'odeabank': 'assets/images/logos/odeabank.svg',
      'papara': 'assets/images/logos/papara.png',
      'paycell': 'assets/images/logos/paycell.png',
      'pttcell': 'assets/images/logos/pttcell.png',
      'qnbfinansbank': 'assets/images/logos/qnbfinansbank.png',
      'qnb': 'assets/images/logos/qnbfinansbank.png',
      'sekerbank': 'assets/images/logos/sekerbank.png',
      'spotify': 'assets/images/logos/spotify.svg',
      'teb': 'assets/images/logos/teb.png',
      'teknosacell': 'assets/images/logos/teknosacell.png',
      'tombank': 'assets/images/logos/tombank.svg',
      'tosla': 'assets/images/logos/tosla.svg',
      'turkcell': 'assets/images/logos/turkcell.png',
      'turkiyefinans': 'assets/images/logos/turkiyefinans.png',
      'turktelekom': 'assets/images/logos/turktelekom.svg',
      'türktelekom': 'assets/images/logos/turktelekom.svg',
      'vakifbank': 'assets/images/logos/vakifbank.svg',
      'vakifkatilim': 'assets/images/logos/vakifkatilim.svg',
      'vodafone': 'assets/images/logos/vodafone.png',
      'yapikredi': 'assets/images/logos/yapikredi.svg',
      'ziraat': 'assets/images/logos/ziraat.png',
      'ziraatbankasi': 'assets/images/logos/ziraat.png',
      'ziraatkatilim': 'assets/images/logos/ziraatkatilim.svg',
    };

    return logoMap[normalized];
  }

  /// Source logo widget'ı döndürür
  static Widget getLogoWidget(
    String sourceName, {
    double? width,
    double? height,
    Color? color,
  }) {
    final logoPath = getLogoPath(sourceName);

    if (logoPath == null) {
      // Logo bulunamadıysa generic icon göster
      return Icon(Icons.business, size: width ?? 24, color: color);
    }

    // SVG mi PNG mi kontrol et
    if (logoPath.endsWith('.svg')) {
      return SvgPicture.asset(
        logoPath,
        width: width,
        height: height,
        fit: BoxFit.contain, // Logo'nun tam görünmesi için
        colorFilter: color != null
            ? ColorFilter.mode(color, BlendMode.srcIn)
            : null,
        placeholderBuilder: (context) => Container(
          width: width,
          height: height,
          color: Colors.grey[200],
          child: Icon(
            Icons.business,
            size: (width ?? 24) * 0.6,
            color: color ?? Colors.grey[400],
          ),
        ),
      );
    } else {
      // PNG/JPG - Daha net görünmesi için fit: BoxFit.contain
      return Image.asset(
        logoPath,
        width: width,
        height: height,
        fit: BoxFit.contain, // Logo'nun tam görünmesi için
        color: color,
        filterQuality: FilterQuality.high, // Daha net görünüm
        errorBuilder: (context, error, stackTrace) => Container(
          width: width,
          height: height,
          color: Colors.grey[200],
          child: Icon(
            Icons.business,
            size: (width ?? 24) * 0.6,
            color: color ?? Colors.grey[400],
          ),
        ),
      );
    }
  }

  /// Source name'den logo rengini döndürür (kart arka planı için)
  static Color getLogoBackgroundColor(String sourceName) {
    // Bazı kaynaklar için özel renkler
    final colorMap = {
      'akbank': const Color(0xFFDC2626),
      'garanti': const Color(0xFF16A34A),
      'halkbank': const Color(0xFF2563EB),
      'isbank': const Color(0xFFDC2626),
      'yapikredi': const Color(0xFFDC2626),
      'ziraat': const Color(0xFF16A34A),
      'turkcell': const Color(0xFFF59E0B),
      'vodafone': const Color(0xFFDC2626),
      'turktelekom': const Color(0xFF2563EB),
      'türktelekom': const Color(0xFF2563EB),
      'papara': const Color(0xFF2D2A32),
      'tosla': const Color(0xFFFF3D57),
      'pttcell': const Color(0xFF0066B2),
      'vakifbank': const Color(0xFFFFB703),
      'kuveytturk': const Color(0xFF0A9F6D),
      'nkolay': const Color(0xFF2E64FE),
      'enpara': const Color(0xFF8A2BE2),
      'netflix': const Color(0xFFE50914),
      'spotify': const Color(0xFF1DB954),
    };

    final normalized = sourceName.toLowerCase().replaceAll(' ', '');
    return colorMap[normalized] ?? const Color(0xFFF3F4F6);
  }
}
