import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:indirim_app/core/l10n/app_localizations.dart';
import 'package:indirim_app/core/utils/network_result.dart';
import 'package:indirim_app/data/models/discovery_models.dart';
import 'package:indirim_app/data/models/opportunity_model.dart';
import 'package:indirim_app/features/discovery/discovery_screen.dart';

OpportunityModel _campaign(String id, String source) {
  return OpportunityModel(
    id: id,
    title: 'Süper İndirim $id',
    subtitle: 'Alt açıklama $id',
    sourceName: source,
    icon: Icons.local_offer,
    iconColor: Colors.blue,
    iconBgColor: Colors.blue.shade50,
    tags: const ['indirim', 'cashback'],
    description: 'Kampanya açıklaması $id',
    discountPercentage: 20,
  );
}

DiscoveryCategorySection _category(String id, String name) {
  return DiscoveryCategorySection(
    id: id,
    name: name,
    icon: '🔥',
    sources: const ['test'],
    minCampaigns: 1,
    campaigns: [
      _campaign('c1-$id', 'Source A'),
      _campaign('c2-$id', 'Source B'),
    ],
    count: 2,
    totalCount: 3,
    hasMore: true,
    isEmpty: false,
    fallbackMessage: null,
  );
}

Widget _app(Widget child) {
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
  testWidgets('Discovery screen golden', (tester) async {
    GoogleFonts.config.allowRuntimeFetching = false;

    final categories = [
      _category('food', 'Yemek'),
      _category('travel', 'Seyahat'),
    ];

    await tester.binding.setSurfaceSize(const Size(390, 844));

    await tester.pumpWidget(
      _app(
        DiscoveryScreen(
          loadDiscoveryCategories: (limit, sort) async {
            return NetworkSuccess(
              DiscoveryCategoriesResult(
                categories: categories,
                totalCategories: categories.length,
                perCategoryLimit: 12,
              ),
            );
          },
          loadDiscoveryCategoryPage: ({
            required categoryId,
            required limit,
            required offset,
            required sort,
          }) async {
            return NetworkSuccess(
              DiscoveryCategoryPageResult(
                category: categories.first,
                campaigns: categories.first.campaigns,
                count: categories.first.campaigns.length,
                totalCount: categories.first.totalCount,
                hasMore: false,
                isEmpty: false,
                fallbackMessage: null,
                limit: limit,
                offset: offset,
              ),
            );
          },
        ),
      ),
    );

    await tester.pumpAndSettle();
    await expectLater(
      find.byType(DiscoveryScreen),
      matchesGoldenFile('goldens/discovery_screen.png'),
    );
  });
}
