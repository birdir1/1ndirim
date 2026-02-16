import 'package:flutter_test/flutter_test.dart';
import 'package:indirim_app/data/models/discovery_models.dart';
import 'package:indirim_app/data/models/opportunity_model.dart';
import 'package:flutter/material.dart';

OpportunityModel _campaign(String id) => OpportunityModel(
  id: id,
  title: 'Title $id',
  subtitle: 'Subtitle',
  sourceName: 'Source',
  icon: Icons.local_offer,
  iconColor: Colors.red,
  iconBgColor: Colors.red.shade50,
  tags: const ['tag'],
);

void main() {
  test('DiscoveryCategorySection copyWith preserves unchanged fields', () {
    final original = DiscoveryCategorySection(
      id: 'food',
      name: 'Food',
      icon: '🍔',
      sources: const ['Test'],
      minCampaigns: 3,
      campaigns: [_campaign('c1')],
      count: 1,
      totalCount: 2,
      hasMore: true,
      isEmpty: false,
      fallbackMessage: 'fallback',
    );

    final updated = original.copyWith(
      campaigns: [_campaign('c1'), _campaign('c2')],
      count: 2,
      hasMore: false,
    );

    expect(updated.id, 'food');
    expect(updated.name, 'Food');
    expect(updated.icon, '🍔');
    expect(updated.sources, ['Test']);
    expect(updated.minCampaigns, 3);
    expect(updated.totalCount, 2);
    expect(updated.fallbackMessage, 'fallback');
    expect(updated.campaigns.length, 2);
    expect(updated.count, 2);
    expect(updated.hasMore, false);
    expect(updated.isEmpty, false);
  });
}
