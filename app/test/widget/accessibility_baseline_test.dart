import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:indirim_app/core/l10n/app_localizations.dart';
import 'package:indirim_app/data/models/opportunity_model.dart';
import 'package:indirim_app/features/compare/compare_screen.dart';

OpportunityModel _sampleOpportunity(String id, String title) {
  return OpportunityModel(
    id: id,
    title: title,
    subtitle: 'Açıklama',
    sourceName: 'Kaynak',
    icon: Icons.local_offer,
    iconColor: Colors.blue,
    iconBgColor: Colors.blue.shade50,
    tags: const ['kampanya'],
  );
}

Widget _testApp(Widget child) {
  return MaterialApp(
    locale: const Locale('tr'),
    localizationsDelegates: const [
      AppLocalizations.delegate,
      GlobalMaterialLocalizations.delegate,
      GlobalWidgetsLocalizations.delegate,
      GlobalCupertinoLocalizations.delegate,
    ],
    supportedLocales: const [Locale('tr'), Locale('en')],
    home: child,
  );
}

void main() {
  testWidgets('Compare screen renders with localized title', (tester) async {
    await tester.pumpWidget(
      _testApp(
        CompareScreen(
          campaigns: [
            _sampleOpportunity('1', 'Kampanya 1'),
            _sampleOpportunity('2', 'Kampanya 2'),
          ],
        ),
      ),
    );

    await tester.pumpAndSettle();
    expect(find.text('Kampanyaları Karşılaştır'), findsOneWidget);
  });
}
