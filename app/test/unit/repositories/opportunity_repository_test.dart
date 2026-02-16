import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:indirim_app/data/repositories/opportunity_repository.dart';
import 'package:indirim_app/core/utils/network_result.dart';

void main() {
  setUpAll(() async {
    // Initialize dotenv for tests
    TestWidgetsFlutterBinding.ensureInitialized();
    dotenv.loadFromString(envString: 'API_BASE_URL=https://api.test.com');
  });

  group('OpportunityRepository', () {
    late OpportunityRepository repository;

    setUp(() {
      repository = OpportunityRepository.instance;
    });

    test('instance returns singleton', () {
      final instance1 = OpportunityRepository.instance;
      final instance2 = OpportunityRepository.instance;

      expect(instance1, same(instance2));
    });

    test('getOpportunities returns NetworkResult', () async {
      final result = await repository.getOpportunities();

      expect(result, isA<NetworkResult>());
    });

    test(
      'getOpportunitiesBySources with empty list returns empty success',
      () async {
        final result = await repository.getOpportunitiesBySources([]);

        expect(result, isA<NetworkSuccess>());
        expect((result as NetworkSuccess).data, isEmpty);
      },
    );

    test('searchCampaigns with empty term returns NetworkResult', () async {
      final result = await repository.searchCampaigns(searchTerm: '');

      expect(result, isA<NetworkResult>());
    });

    test(
      'searchCampaigns with whitespace term returns NetworkResult',
      () async {
        final result = await repository.searchCampaigns(searchTerm: '   ');

        expect(result, isA<NetworkResult>());
      },
    );

    test('getDiscoveryCategories returns NetworkResult', () async {
      final result = await repository.getDiscoveryCategories(limit: 5);
      expect(result, isA<NetworkResult>());
    });

    test('getDiscoveryByCategory returns NetworkResult', () async {
      final result = await repository.getDiscoveryByCategory(
        categoryId: 'entertainment',
        limit: 5,
        offset: 0,
      );
      expect(result, isA<NetworkResult>());
    });
  });
}
