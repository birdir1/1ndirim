import 'package:intl/intl.dart';

/// ISO tarih stringini TR formatına çevirir.
/// Örn: 2030-12-31 -> 31.12.2030
String formatDateTr(String iso) {
  if (iso.isEmpty) return '';
  try {
    final dt = DateTime.parse(iso);
    // Sonsuz/placeholder tarihler için (>= 2030)
    if (dt.year >= 2030) return 'Sürekli kampanya';
    final fmt = DateFormat('dd.MM.yyyy', 'tr_TR');
    return fmt.format(dt);
  } catch (_) {
    return '';
  }
}
