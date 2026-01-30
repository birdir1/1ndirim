import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:indirim_app/core/config/api_config.dart';

void main() {
  setUpAll(() async {
    // Initialize dotenv for tests
    TestWidgetsFlutterBinding.ensureInitialized();
    dotenv.testLoad(fileInput: 'API_BASE_URL=https://api.test.com');
  });

  group('ApiConfig', () {
    test('baseUrl returns valid URL', () {
      final baseUrl = ApiConfig.baseUrl;

      expect(baseUrl, isNotEmpty);
      expect(baseUrl, contains('http'));
    });

    test('environment is either development or production', () {
      final env = ApiConfig.environment;

      expect(env, anyOf(Environment.development, Environment.production));
    });

    test('isDevelopment and isProduction are mutually exclusive', () {
      final isDev = ApiConfig.isDevelopment;
      final isProd = ApiConfig.isProduction;

      expect(isDev != isProd, isTrue);
    });

    test('campaigns endpoint is defined', () {
      expect(ApiConfig.campaigns, '/campaigns');
    });

    test('sources endpoint is defined', () {
      expect(ApiConfig.sources, '/sources');
    });

    test('health endpoint is defined', () {
      expect(ApiConfig.health, '/health');
    });

    test('connectTimeout is reasonable', () {
      expect(ApiConfig.connectTimeout.inSeconds, greaterThan(0));
      expect(ApiConfig.connectTimeout.inSeconds, lessThanOrEqualTo(30));
    });

    test('receiveTimeout is reasonable', () {
      expect(ApiConfig.receiveTimeout.inSeconds, greaterThan(0));
      expect(ApiConfig.receiveTimeout.inSeconds, lessThanOrEqualTo(30));
    });
  });
}
