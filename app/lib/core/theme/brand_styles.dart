import 'package:flutter/material.dart';

/// Marka teması için renk seti
class BrandStyle {
  final Color primary;
  final Color background;

  const BrandStyle({required this.primary, required this.background});
}

/// Kaynağa göre marka renklerini döndürür
class BrandStyles {
  static final Map<String, BrandStyle> _styles = {
    // Operatörler
    'turkcell': _style(const Color(0xFFF8B500)),
    'vodafone': _style(const Color(0xFFE60000)),
    'turktelekom': _style(const Color(0xFF00539B)),
    'türktelekom': _style(const Color(0xFF00539B)),
    'pttcell': _style(const Color(0xFF0066B2)),
    'bimcell': _style(const Color(0xFFFFB700)),

    // Kamu bankaları
    'ziraat': _style(const Color(0xFFE60023)),
    'ziraatbankasi': _style(const Color(0xFFE60023)),
    'halkbank': _style(const Color(0xFF0059B3)),
    'vakifbank': _style(const Color(0xFFFFB500)),

    // Özel bankalar
    'akbank': _style(const Color(0xFFD00000)),
    'garanti': _style(const Color(0xFF1F8F4E)),
    'isbank': _style(const Color(0xFF005CA8)),
    'işbank': _style(const Color(0xFF005CA8)),
    'yapikredi': _style(const Color(0xFF1F2F6B)),
    'qnbfinansbank': _style(const Color(0xFF4B306A)),
    'denizbank': _style(const Color(0xFF0097D8)),
    'teb': _style(const Color(0xFF009877)),
    'ingbank': _style(const Color(0xFFFF6600)),
    'ing': _style(const Color(0xFFFF6600)),
    'sekerbank': _style(const Color(0xFF478732)),
    'fibabanka': _style(const Color(0xFF0072BC)),
    'anadolubank': _style(const Color(0xFF6E2F8A)),
    'alternatifbank': _style(const Color(0xFFA51E5B)),
    'odeabank': _style(const Color(0xFF1A1A1A)),
    'icbc': _style(const Color(0xFFC40E1F)),
    'burganbank': _style(const Color(0xFF006BA6)),
    'hsbc': _style(const Color(0xFFDB0011)),

    // Katılım / dijital
    'kuveytturk': _style(const Color(0xFF0A9F6D)),
    'albarakaturk': _style(const Color(0xFFF58220)),
    'turkiyefinans': _style(const Color(0xFF00A3E0)),
    'vakifkatilim': _style(const Color(0xFF7A1B71)),
    'ziraatkatilim': _style(const Color(0xFFA32638)),
    'emlakkatilim': _style(const Color(0xFFE1002A)),
    'enpara': _style(const Color(0xFF8B1E87)),
    'nkolay': _style(const Color(0xFF2E64FE)),
    'cepteteb': _style(const Color(0xFF00A651)),

    // Fintech / cüzdan
    // Papara brand is essentially black/white; keep UI neutral (no purple).
    'papara': _style(const Color(0xFF111111)),
    'paycell': _style(const Color(0xFF111111)),
    'tosla': _style(const Color(0xFFFF3D57)),
    'papel': _style(const Color(0xFF434444)),
  };

  static BrandStyle getStyle(String sourceName) {
    final key = _normalize(sourceName);
    return _styles[key] ??
        const BrandStyle(
          primary: Color(0xFF1F2937), // koyu gri
          background: Color(0xFFF5F5F5),
        );
  }

  static BrandStyle _style(Color primary) {
    // Arka plan için daha açık, yumuşak ton
    return BrandStyle(primary: primary, background: primary.withValues(alpha: 0.08));
  }

  static String _normalize(String name) {
    return name
        .toLowerCase()
        .replaceAll(' ', '')
        .replaceAll('ı', 'i')
        .replaceAll('ğ', 'g')
        .replaceAll('ü', 'u')
        .replaceAll('ş', 's')
        .replaceAll('ö', 'o')
        .replaceAll('ç', 'c');
  }
}
