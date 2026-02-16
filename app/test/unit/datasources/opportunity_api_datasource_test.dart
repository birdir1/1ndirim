import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:indirim_app/data/datasources/opportunity_api_datasource.dart';

typedef ResponseBuilder = ResponseBody Function(RequestOptions options);

class _StubAdapter implements HttpClientAdapter {
  final ResponseBuilder responseBuilder;

  _StubAdapter(this.responseBuilder);

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    return responseBuilder(options);
  }

  @override
  void close({bool force = false}) {}
}

ResponseBody _jsonResponse(Map<String, dynamic> body, {int statusCode = 200}) {
  return ResponseBody.fromString(
    jsonEncode(body),
    statusCode,
    headers: {
      Headers.contentTypeHeader: [Headers.jsonContentType],
    },
  );
}

Map<String, dynamic> _campaignJson(String id) {
  return {
    'id': id,
    'title': 'Kampanya $id',
    'subtitle': 'Detay aciklamasi',
    'sourceName': 'Test Bank',
    'icon': 'local_offer',
    'iconColor': '#DC2626',
    'iconBgColor': '#FEE2E2',
    'tags': ['indirim', 'cashback'],
    'description': 'Kampanya aciklamasi',
    'detailText': 'Kampanya detay metni',
    'discountPercentage': 10,
  };
}

void main() {
  group('OpportunityApiDataSource discovery parsing', () {
    test('getDiscoveryCategories parses response contract', () async {
      final dio = Dio(BaseOptions(baseUrl: 'https://api.test.com/api'));
      dio.httpClientAdapter = _StubAdapter((options) {
        expect(options.path, '/campaigns/discover');
        expect(options.queryParameters['limit'], 12);
        return _jsonResponse({
          'success': true,
          'data': [
            {
              'id': 'food',
              'name': 'Yemek',
              'icon': '🍔',
              'sources': ['Yemeksepeti'],
              'minCampaigns': 3,
              'campaigns': [_campaignJson('c1')],
              'count': 1,
              'totalCount': 5,
              'hasMore': true,
              'isEmpty': false,
              'fallbackMessage': null,
            },
          ],
          'totalCategories': '1',
          'pagination': {'perCategoryLimit': '12'},
        });
      });

      final dataSource = OpportunityApiDataSource(dio: dio);
      final result = await dataSource.getDiscoveryCategories(limit: 12);

      expect(result.totalCategories, 1);
      expect(result.perCategoryLimit, 12);
      expect(result.categories, hasLength(1));
      expect(result.categories.first.id, 'food');
      expect(result.categories.first.campaigns, hasLength(1));
      expect(result.categories.first.campaigns.first.id, 'c1');
      expect(result.categories.first.hasMore, true);
    });

    test('getDiscoveryCategories throws on invalid data shape', () async {
      final dio = Dio(BaseOptions(baseUrl: 'https://api.test.com/api'));
      dio.httpClientAdapter = _StubAdapter((options) {
        return _jsonResponse({
          'success': true,
          'data': {'unexpected': 'object'},
        });
      });

      final dataSource = OpportunityApiDataSource(dio: dio);

      expect(
        () => dataSource.getDiscoveryCategories(limit: 5),
        throwsA(
          predicate(
            (e) =>
                e is Exception &&
                e.toString().contains('Keşfet verisi formatı geçersiz'),
          ),
        ),
      );
    });

    test(
      'getDiscoveryCategories throws when campaign item misses required fields',
      () async {
        final dio = Dio(BaseOptions(baseUrl: 'https://api.test.com/api'));
        dio.httpClientAdapter = _StubAdapter((options) {
          return _jsonResponse({
            'success': true,
            'data': [
              {
                'id': 'food',
                'name': 'Yemek',
                'icon': '🍔',
                'campaigns': [
                  {
                    // missing id/title/sourceName causes mapper to throw
                    'subtitle': 'Eksik kampanya',
                  },
                ],
                'count': 1,
                'totalCount': 1,
                'hasMore': false,
                'isEmpty': false,
              },
            ],
          });
        });

        final dataSource = OpportunityApiDataSource(dio: dio);

        expect(
          () => dataSource.getDiscoveryCategories(limit: 5),
          throwsA(
            predicate(
              (e) =>
                  e is Exception &&
                  (e.toString().contains('işlenemedi') ||
                      e.toString().contains('hata')),
            ),
          ),
        );
      },
    );

    test('getDiscoveryByCategory parses page and pagination', () async {
      final dio = Dio(BaseOptions(baseUrl: 'https://api.test.com/api'));
      dio.httpClientAdapter = _StubAdapter((options) {
        expect(options.path, '/campaigns/discover/food');
        expect(options.queryParameters['limit'], 20);
        expect(options.queryParameters['offset'], 40);
        return _jsonResponse({
          'success': true,
          'data': {
            'category': {
              'id': 'food',
              'name': 'Yemek',
              'icon': '🍔',
              'sources': ['Yemeksepeti'],
              'minCampaigns': 3,
            },
            'campaigns': [_campaignJson('c2')],
            'count': 1,
            'totalCount': 41,
            'hasMore': false,
            'isEmpty': false,
            'fallbackMessage': null,
            'pagination': {'limit': '20', 'offset': '40'},
          },
        });
      });

      final dataSource = OpportunityApiDataSource(dio: dio);
      final page = await dataSource.getDiscoveryByCategory(
        categoryId: 'food',
        limit: 20,
        offset: 40,
      );

      expect(page.category.id, 'food');
      expect(page.campaigns, hasLength(1));
      expect(page.campaigns.first.id, 'c2');
      expect(page.totalCount, 41);
      expect(page.hasMore, false);
      expect(page.limit, 20);
      expect(page.offset, 40);
    });

    test('getDiscoveryByCategory throws backend error message', () async {
      final dio = Dio(BaseOptions(baseUrl: 'https://api.test.com/api'));
      dio.httpClientAdapter = _StubAdapter((options) {
        return _jsonResponse({
          'success': false,
          'error': 'Kategori verisi alınamadı',
        });
      });

      final dataSource = OpportunityApiDataSource(dio: dio);

      expect(
        () => dataSource.getDiscoveryByCategory(
          categoryId: 'food',
          limit: 10,
          offset: 0,
        ),
        throwsA(
          predicate(
            (e) =>
                e is Exception &&
                e.toString().contains('Kategori verisi alınamadı'),
          ),
        ),
      );
    });
  });
}
