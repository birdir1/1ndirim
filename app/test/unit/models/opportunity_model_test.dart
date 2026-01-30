import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:indirim_app/data/models/opportunity_model.dart';

void main() {
  group('OpportunityModel', () {
    test('creates model with required fields', () {
      final model = OpportunityModel(
        id: 'test-id',
        title: 'Test Campaign',
        subtitle: 'Test Subtitle',
        sourceName: 'Test Source',
        icon: Icons.local_offer,
        iconColor: Colors.red,
        iconBgColor: Colors.red.shade100,
        tags: ['tag1', 'tag2'],
      );

      expect(model.id, 'test-id');
      expect(model.title, 'Test Campaign');
      expect(model.subtitle, 'Test Subtitle');
      expect(model.sourceName, 'Test Source');
      expect(model.tags, hasLength(2));
      expect(model.icon, Icons.local_offer);
    });

    test('creates model with optional fields', () {
      final model = OpportunityModel(
        id: 'test-id',
        title: 'Test Campaign',
        subtitle: 'Test Subtitle',
        sourceName: 'Test Source',
        icon: Icons.local_offer,
        iconColor: Colors.red,
        iconBgColor: Colors.red.shade100,
        tags: [],
        affiliateUrl: 'https://affiliate.com',
        originalUrl: 'https://example.com',
        expiresAt: '2026-12-31T23:59:59Z',
        currentPrice: 100.0,
        originalPrice: 200.0,
        discountPercentage: 50.0,
      );

      expect(model.affiliateUrl, 'https://affiliate.com');
      expect(model.originalUrl, 'https://example.com');
      expect(model.expiresAt, '2026-12-31T23:59:59Z');
      expect(model.currentPrice, 100.0);
      expect(model.originalPrice, 200.0);
      expect(model.discountPercentage, 50.0);
    });

    test('tags can be empty', () {
      final model = OpportunityModel(
        id: 'test-id',
        title: 'Test Campaign',
        subtitle: 'Test Subtitle',
        sourceName: 'Test Source',
        icon: Icons.local_offer,
        iconColor: Colors.red,
        iconBgColor: Colors.red.shade100,
        tags: [],
      );

      expect(model.tags, isEmpty);
    });

    test('optional fields can be null', () {
      final model = OpportunityModel(
        id: 'test-id',
        title: 'Test Campaign',
        subtitle: 'Test Subtitle',
        sourceName: 'Test Source',
        icon: Icons.local_offer,
        iconColor: Colors.red,
        iconBgColor: Colors.red.shade100,
        tags: [],
      );

      expect(model.affiliateUrl, isNull);
      expect(model.originalUrl, isNull);
      expect(model.expiresAt, isNull);
      expect(model.currentPrice, isNull);
      expect(model.originalPrice, isNull);
      expect(model.discountPercentage, isNull);
    });
  });
}
