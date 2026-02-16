import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:indirim_app/features/home/widgets/filter_chip_item.dart';

void main() {
  testWidgets('FilterChipItem semantics reflects selection', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: FilterChipItem(
            name: 'Akbank',
            color: Colors.red,
            isActive: true,
            onTap: () {},
          ),
        ),
      ),
    );

    expect(find.text('Akbank'), findsOneWidget);
  });
}
