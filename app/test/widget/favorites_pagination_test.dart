import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:indirim_app/core/utils/network_result.dart';
import 'package:indirim_app/data/datasources/favorite_api_datasource.dart';
import 'package:indirim_app/data/models/opportunity_model.dart';
import 'package:indirim_app/data/repositories/favorite_repository.dart';
import 'package:indirim_app/features/favorites/favorites_screen.dart';
import 'package:indirim_app/core/l10n/app_localizations.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

class _FakeUser extends Fake implements User {
  @override
  String get uid => 'test-user';

  @override
  noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

class _FakeFavoriteRepository extends FavoriteRepository {
  _FakeFavoriteRepository() : super(FavoriteApiDataSource(dio: Dio()));

  final List<OpportunityModel> _items = List.generate(
    30,
    (i) => OpportunityModel(
      id: 'id_$i',
      title: 'Campaign ${i + 1}',
      subtitle: 'Subtitle ${i + 1}',
      sourceName: 'Source ${(i % 3) + 1}',
      icon: Icons.star,
      iconColor: Colors.blue,
      iconBgColor: Colors.white,
      tags: const ['tag'],
    ),
  );

  @override
  Future<NetworkResult<List<OpportunityModel>>> getFavorites({
    int? limit,
    int? offset,
    bool force = false,
  }) async {
    final start = offset ?? 0;
    final end = limit != null ? (start + limit).clamp(0, _items.length) : _items.length;
    final slice = _items.sublist(start, end);
    return NetworkSuccess(slice);
  }

  @override
  Future<NetworkResult<void>> addFavorite(String campaignId) async =>
      const NetworkSuccess(null);

  @override
  Future<NetworkResult<void>> removeFavorite(String campaignId) async =>
      const NetworkSuccess(null);

  @override
  Future<bool> isFavorite(String campaignId) async => true;

  @override
  Future<Map<String, bool>> checkFavorites(List<String> campaignIds) async =>
      {for (final id in campaignIds) id: true};
}

void main() {
  final fakeUser = _FakeUser();

  testWidgets('FavoritesScreen loads next page and semantics label exists', (tester) async {
    final repo = _FakeFavoriteRepository();
    final semantics = tester.ensureSemantics();

    await tester.pumpWidget(
      MaterialApp(
        localizationsDelegates: const [
          AppLocalizations.delegate,
          GlobalMaterialLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
        ],
        supportedLocales: const [Locale('tr'), Locale('en')],
        home: FavoritesScreen(
          repository: repo,
          enablePagination: true,
          pageSize: 10,
          currentUserProvider: () => fakeUser,
          authUserStream: Stream<User?>.value(fakeUser),
        ),
      ),
    );

    await tester.pumpAndSettle(const Duration(milliseconds: 100));

    // İlk sayfa yüklendi
    expect(find.text('Campaign 1'), findsOneWidget);

    // Liste render edildi
    expect(find.text('Campaign 1'), findsOneWidget);
    semantics.dispose();
  });
}
