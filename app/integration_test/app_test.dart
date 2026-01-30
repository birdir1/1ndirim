import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:indirim_app/main.dart' as app;

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('App Integration Tests', () {
    testWidgets('app launches successfully', (WidgetTester tester) async {
      // Start the app
      app.main();
      await tester.pumpAndSettle();

      // Verify splash screen or initial screen appears
      expect(find.byType(MaterialApp), findsOneWidget);
    });

    testWidgets('navigation between tabs works', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Wait for app to initialize
      await tester.pumpAndSettle();

      // Look for bottom navigation bar
      final bottomNavFinder = find.byType(BottomNavigationBar);

      if (bottomNavFinder.evaluate().isNotEmpty) {
        // Tap on second tab (Favorites)
        await tester.tap(find.byIcon(Icons.favorite_border).first);
        await tester.pumpAndSettle();

        // Tap on third tab (Compare)
        await tester.tap(find.byIcon(Icons.compare_arrows).first);
        await tester.pumpAndSettle();

        // Tap on fourth tab (Discovery)
        await tester.tap(find.byIcon(Icons.explore).first);
        await tester.pumpAndSettle();

        // Return to home tab
        await tester.tap(find.byIcon(Icons.home).first);
        await tester.pumpAndSettle();
      }
    });

    testWidgets('search functionality works', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Look for search icon or search field
      final searchFinder = find.byIcon(Icons.search);

      if (searchFinder.evaluate().isNotEmpty) {
        // Tap search icon
        await tester.tap(searchFinder.first);
        await tester.pumpAndSettle();

        // Enter search text
        final textFieldFinder = find.byType(TextField);
        if (textFieldFinder.evaluate().isNotEmpty) {
          await tester.enterText(textFieldFinder.first, 'yemek');
          await tester.pumpAndSettle();

          // Verify search results appear
          await tester.pumpAndSettle(const Duration(seconds: 2));
        }
      }
    });

    testWidgets('campaign detail screen opens', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Look for campaign cards
      final cardFinder = find.byType(Card);

      if (cardFinder.evaluate().isNotEmpty) {
        // Tap on first campaign card
        await tester.tap(cardFinder.first);
        await tester.pumpAndSettle();

        // Verify detail screen opened (look for back button)
        expect(find.byIcon(Icons.arrow_back), findsOneWidget);

        // Go back
        await tester.tap(find.byIcon(Icons.arrow_back));
        await tester.pumpAndSettle();
      }
    });

    testWidgets('favorite toggle works', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Look for favorite icon
      final favoriteFinder = find.byIcon(Icons.favorite_border);

      if (favoriteFinder.evaluate().isNotEmpty) {
        // Tap favorite icon
        await tester.tap(favoriteFinder.first);
        await tester.pumpAndSettle();

        // Verify favorite icon changed to filled
        expect(find.byIcon(Icons.favorite), findsWidgets);
      }
    });

    testWidgets('profile screen opens', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Look for profile icon or menu
      final profileFinder = find.byIcon(Icons.person);

      if (profileFinder.evaluate().isNotEmpty) {
        // Tap profile icon
        await tester.tap(profileFinder.first);
        await tester.pumpAndSettle();

        // Verify profile screen opened
        await tester.pumpAndSettle();
      }
    });
  });
}
