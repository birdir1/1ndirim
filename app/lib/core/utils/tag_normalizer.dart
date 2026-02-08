import 'package:collection/collection.dart';

/// Etiketleri kullanıcıya gösterilebilir hale getiren yardımcı sınıf.
class NormalizedTags {
  final String? primary;
  final List<String> secondary;

  const NormalizedTags({this.primary, this.secondary = const []});
}

class TagNormalizer {
  static final Set<String> _blacklist = {
    'general',
    'transport',
    'transpor',
    'general transport',
    'general transpor',
    'education',
    'business',
    'finance',
    'card',
    'cardcampaign',
    'url',
    'url source',
    'source',
    'title',
    'image',
    'banner',
    'campaign',
    'kampanya',
    'faz7',
    'faz',
    'tag',
    'labels',
  };

  static final Map<String, String> _map = {
    'education': 'Eğitim',
    'transport': 'Ulaşım',
    'travel': 'Seyahat',
    'fuel': 'Akaryakıt',
    'gas': 'Akaryakıt',
    'grocery': 'Market',
    'market': 'Market',
    'pharmacy': 'Eczane',
    'health': 'Sağlık',
    'food': 'Yemek',
    'restaurant': 'Restoran',
    'cafe': 'Kafe',
    'entertainment': 'Eğlence',
    'electronics': 'Elektronik',
    'utilities': 'Fatura',
    'bill': 'Fatura',
    'internet': 'İnternet',
    'mobile': 'Mobil',
    'bank': 'Banka',
    'wallet': 'Cüzdan',
    'finans': 'Finans',
    'cashback': 'Cashback',
    'bonus': 'Bonus',
    'points': 'Puan',
    'investment': 'Yatırım',
    'savings': 'Birikim',
    'insurance': 'Sigorta',
    'shopping': 'Alışveriş',
    'fashion': 'Moda',
    'airline': 'Uçuş',
    'hotel': 'Otel',
    'education ': 'Eğitim',
    'operator': 'Operatör',
    'campaign': 'Kampanya',
  };

  static NormalizedTags normalize(List<String> tags) {
    final cleaned = <String>[];

    for (final raw in tags) {
      final t = raw.trim();
      if (t.isEmpty) continue;
      final lower = t.toLowerCase();

      // noise / dosya / url
      if (lower.contains('http') ||
          lower.contains('.jpg') ||
          lower.contains('.png') ||
          lower.contains('.jpeg') ||
          lower.startsWith('title:')) {
        continue;
      }
      if (t.length > 50 || t.length < 2) continue;
      if (RegExp(r'^[0-9%]+$').hasMatch(lower)) continue;

      final normalizedKey = lower.replaceAll('_', ' ').replaceAll('-', ' ');
      if (_blacklist.contains(normalizedKey)) continue;

      // mapping
      final mapped = _map.entries
          .firstWhereOrNull((e) => normalizedKey.contains(e.key))
          ?.value;

      final display =
          mapped ??
          normalizedKey
              .split(' ')
              .map(
                (word) => word.isEmpty
                    ? ''
                    : '${word[0].toUpperCase()}${word.substring(1)}',
              )
              .join(' ')
              .trim();

      if (display.isEmpty) continue;
      if (!cleaned.contains(display)) cleaned.add(display);
    }

    if (cleaned.isEmpty) {
      return const NormalizedTags(primary: null, secondary: []);
    }

    // Öncelik: indirim/puan içeren etiketler
    final prioritized = cleaned.sortedBy<num>((t) {
      final lower = t.toLowerCase();
      if (lower.contains('%') || lower.contains('indirim')) return 0;
      if (lower.contains('puan') || lower.contains('bonus')) return 1;
      return 2;
    });

    final primary = prioritized.first;
    final secondary = prioritized.skip(1).take(5).toList();
    return NormalizedTags(primary: primary, secondary: secondary);
  }
}
