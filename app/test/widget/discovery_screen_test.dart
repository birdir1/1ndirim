import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:indirim_app/core/l10n/app_localizations.dart';
import 'package:indirim_app/core/utils/network_result.dart';
import 'package:indirim_app/data/models/discovery_models.dart';
import 'package:indirim_app/data/models/opportunity_model.dart';
import 'package:indirim_app/features/discovery/discovery_screen.dart';

OpportunityModel _campaign(int id) {
  return OpportunityModel(
    id: 'c$id',
    title: 'Kampanya $id %20 cashback',
    subtitle: 'Detayli kampanya aciklamasi',
    sourceName: 'TestSource',
    icon: Icons.local_offer,
    iconColor: Colors.blue,
    iconBgColor: Colors.blue.shade50,
    tags: const ['indirim', 'cashback'],
    description: 'Kampanya aciklama metni',
    discountPercentage: 20,
  );
}

DiscoveryCategorySection _category({
  required String id,
  required String name,
  required List<OpportunityModel> campaigns,
  required bool hasMore,
  int? totalCount,
}) {
  return DiscoveryCategorySection(
    id: id,
    name: name,
    icon: '🔥',
    sources: const ['testsource'],
    minCampaigns: 3,
    campaigns: campaigns,
    count: campaigns.length,
    totalCount: totalCount ?? campaigns.length,
    hasMore: hasMore,
    isEmpty: campaigns.isEmpty,
    fallbackMessage: null,
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
  testWidgets('Discovery renders loaded content after async category fetch', (
    tester,
  ) async {
    final completer = Completer<NetworkResult<DiscoveryCategoriesResult>>();

    await tester.pumpWidget(
      _testApp(
        DiscoveryScreen(loadDiscoveryCategories: (_, __) => completer.future),
      ),
    );

    completer.complete(
      NetworkSuccess(
        DiscoveryCategoriesResult(
          categories: [
            _category(
              id: 'food',
              name: 'Yemek',
              campaigns: [_campaign(1)],
              hasMore: false,
            ),
          ],
          totalCategories: 1,
          perCategoryLimit: 12,
        ),
      ),
    );

    await tester.pumpAndSettle();
    expect(find.text('Sizin İçin Seçtiklerimiz'), findsOneWidget);
  });

  testWidgets('Discovery renders error state when loading fails', (
    tester,
  ) async {
    await tester.pumpWidget(
      _testApp(
        DiscoveryScreen(
          loadDiscoveryCategories: (_, __) async {
            return NetworkError.general('Sunucuya ulasilamadi');
          },
        ),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('Bir Hata Oluştu'), findsOneWidget);
    expect(find.text('Sunucuya ulasilamadi'), findsOneWidget);
    expect(find.text('Tekrar Dene'), findsOneWidget);
  });

  testWidgets(
    'Discovery load more calls backend page endpoint and hides button after last page',
    (tester) async {
      final initialCampaigns = [_campaign(1)];
      final nextCampaigns = [_campaign(2), _campaign(3)];

      String? requestedCategoryId;
      int? requestedLimit;
      int? requestedOffset;

      await tester.pumpWidget(
        _testApp(
          DiscoveryScreen(
            loadDiscoveryCategories: (_, __) async {
              return NetworkSuccess(
                DiscoveryCategoriesResult(
                  categories: [
                    _category(
                      id: 'food',
                      name: 'Yemek',
                      campaigns: initialCampaigns,
                      hasMore: true,
                      totalCount: 3,
                    ),
                  ],
                  totalCategories: 1,
                  perCategoryLimit: 12,
                ),
              );
            },
            loadDiscoveryCategoryPage:
                ({
                  required categoryId,
                  required limit,
                  required offset,
                  required sort,
                }) async {
                  requestedCategoryId = categoryId;
                  requestedLimit = limit;
                  requestedOffset = offset;

                  final category = _category(
                    id: 'food',
                    name: 'Yemek',
                    campaigns: nextCampaigns,
                    hasMore: false,
                    totalCount: 3,
                  );

                  return NetworkSuccess(
                    DiscoveryCategoryPageResult(
                      category: category,
                      campaigns: nextCampaigns,
                      count: nextCampaigns.length,
                      totalCount: 3,
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
      expect(find.byType(CustomScrollView), findsOneWidget);
      await tester.drag(find.byType(CustomScrollView), const Offset(0, -1200));
      await tester.pumpAndSettle();

      expect(find.byType(OutlinedButton), findsOneWidget);

      await tester.tap(find.byType(OutlinedButton));
      await tester.pumpAndSettle();

      expect(requestedCategoryId, 'food');
      expect(requestedLimit, 20);
      expect(requestedOffset, 1);
      expect(find.byType(OutlinedButton), findsNothing);
    },
  );

  testWidgets('Discovery shows load more error and keeps button visible', (
    tester,
  ) async {
    final initialCampaigns = [_campaign(1)];

    await tester.pumpWidget(
      _testApp(
        DiscoveryScreen(
          loadDiscoveryCategories: (_, __) async {
            return NetworkSuccess(
              DiscoveryCategoriesResult(
                categories: [
                  _category(
                    id: 'travel',
                    name: 'Seyahat',
                    campaigns: initialCampaigns,
                    hasMore: true,
                    totalCount: 2,
                  ),
                ],
                totalCategories: 1,
                perCategoryLimit: 12,
              ),
            );
          },
          loadDiscoveryCategoryPage:
              ({
                required categoryId,
                required limit,
                required offset,
                required sort,
              }) async {
                return NetworkError.general('Daha fazla kampanya yuklenemedi');
              },
        ),
      ),
    );

    await tester.pumpAndSettle();
    expect(find.byType(CustomScrollView), findsOneWidget);
    await tester.drag(find.byType(CustomScrollView), const Offset(0, -1200));
    await tester.pumpAndSettle();

    await tester.tap(find.byType(OutlinedButton));
    await tester.pumpAndSettle();

    expect(find.text('Daha fazla kampanya yuklenemedi'), findsOneWidget);
    expect(find.byType(OutlinedButton), findsOneWidget);
  });

  testWidgets('Discovery renders empty state with fallback message', (
    tester,
  ) async {
    await tester.pumpWidget(
      _testApp(
        DiscoveryScreen(
          loadDiscoveryCategories: (_, __) async {
            return NetworkSuccess(
              DiscoveryCategoriesResult(
                categories: [
                  _category(
                    id: 'travel',
                    name: 'Seyahat',
                    campaigns: const [],
                    hasMore: false,
                    totalCount: 0,
                  ).copyWith(
                    campaigns: const [],
                    count: 0,
                    totalCount: 0,
                    hasMore: false,
                    isEmpty: true,
                    fallbackMessage: 'Yakında seyahat kampanyaları eklenecek',
                  ),
                ],
                totalCategories: 1,
                perCategoryLimit: 12,
              ),
            );
          },
        ),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('Yakında seyahat kampanyaları eklenecek'), findsOneWidget);
    expect(find.text('Seyahat'), findsOneWidget);
  });

  testWidgets('Discovery hides load more when hasMore is false', (
    tester,
  ) async {
    final initialCampaigns = List.generate(5, (i) => _campaign(i + 1));

    await tester.pumpWidget(
      _testApp(
        DiscoveryScreen(
          loadDiscoveryCategories: (_, __) async {
            return NetworkSuccess(
              DiscoveryCategoriesResult(
                categories: [
                  _category(
                    id: 'food',
                    name: 'Yemek',
                    campaigns: initialCampaigns,
                    hasMore: false,
                    totalCount: 5,
                  ),
                ],
                totalCategories: 1,
                perCategoryLimit: 12,
              ),
            );
          },
        ),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.byType(OutlinedButton), findsNothing);
  });
}
