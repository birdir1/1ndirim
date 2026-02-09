import 'package:flutter/material.dart';

/// Banka/Operatör Segment Modeli
class SourceSegment {
  final String id;
  final String name;
  bool isSelected;

  SourceSegment({
    required this.id,
    required this.name,
    this.isSelected = false,
  });

  SourceSegment copyWith({String? id, String? name, bool? isSelected}) {
    return SourceSegment(
      id: id ?? this.id,
      name: name ?? this.name,
      isSelected: isSelected ?? this.isSelected,
    );
  }
}

/// Banka/Operatör Modeli
class SourceModel {
  final String id;
  final String name;
  final String type; // 'bank' or 'operator'
  final IconData icon;
  final Color color;
  final List<SourceSegment> segments;
  bool isSelected;
  final bool hasScraper;
  final bool planned;
  final bool noCampaignPage;

  SourceModel({
    required this.id,
    required this.name,
    required this.type,
    required this.icon,
    required this.color,
    this.segments = const [],
    this.isSelected = false,
    this.hasScraper = true,
    this.planned = false,
    this.noCampaignPage = false,
  });

  SourceModel copyWith({
    String? id,
    String? name,
    String? type,
    IconData? icon,
    Color? color,
    List<SourceSegment>? segments,
    bool? isSelected,
    bool? hasScraper,
    bool? planned,
    bool? noCampaignPage,
  }) {
    return SourceModel(
      id: id ?? this.id,
      name: name ?? this.name,
      type: type ?? this.type,
      icon: icon ?? this.icon,
      color: color ?? this.color,
      segments: segments ?? this.segments,
      isSelected: isSelected ?? this.isSelected,
      hasScraper: hasScraper ?? this.hasScraper,
      planned: planned ?? this.planned,
      noCampaignPage: noCampaignPage ?? this.noCampaignPage,
    );
  }
}
