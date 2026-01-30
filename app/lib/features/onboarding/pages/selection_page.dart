import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../data/models/source_model.dart';
import '../../../data/repositories/source_repository.dart';
import '../widgets/source_selection_grid.dart';

/// Onboarding 2 - Selection
/// "Ne kullandığını seç."
class SelectionPage extends StatefulWidget {
  final VoidCallback onNext;
  final VoidCallback onBack;
  final VoidCallback? onSkip;
  final Function(List<String>) onSourcesChanged;
  final bool isDark;

  const SelectionPage({
    super.key,
    required this.onNext,
    required this.onBack,
    this.onSkip,
    required this.onSourcesChanged,
    this.isDark = false,
  });

  @override
  State<SelectionPage> createState() => _SelectionPageState();
}

class _SelectionPageState extends State<SelectionPage> {
  late List<SourceModel> _sources;
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _sources = SourceRepository.getAllSources()
        .map(
          (s) => SourceModel(
            id: s.id,
            name: s.name,
            type: s.type,
            icon: s.icon,
            color: s.color,
            segments: [],
            isSelected: false,
          ),
        )
        .toList();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _toggleSource(String id) {
    setState(() {
      final index = _sources.indexWhere((s) => s.id == id);
      if (index != -1) {
        _sources[index].isSelected = !_sources[index].isSelected;
      }
    });
    _notifySourcesChanged();
  }

  void _notifySourcesChanged() {
    final selectedIds = _sources
        .where((s) => s.isSelected)
        .map((s) => s.id)
        .toList();
    widget.onSourcesChanged(selectedIds);
  }

  List<SourceModel> get _filteredSources {
    if (_searchQuery.isEmpty) return _sources;
    return _sources.where((s) {
      return s.name.toLowerCase().contains(_searchQuery.toLowerCase());
    }).toList();
  }

  List<SourceModel> get _banks {
    return _filteredSources.where((s) => s.type == 'bank').toList();
  }

  List<SourceModel> get _operators {
    return _filteredSources.where((s) => s.type == 'operator').toList();
  }

  bool get _hasSelection => _sources.any((s) => s.isSelected);

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Container(
        color: AppColors.backgroundLight, // Pembe arka plan
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        child: Column(
          children: [
            // Skip button at top right
            if (widget.onSkip != null)
              Align(
                alignment: Alignment.topRight,
                child: TextButton(
                  onPressed: widget.onSkip,
                  child: Text(
                    'Atla',
                    style: AppTextStyles.body(isDark: widget.isDark).copyWith(
                      color: AppColors.textSecondaryLight,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),

            // Arama çubuğu
            Container(
              height: 52,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.05),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: TextField(
                controller: _searchController,
                style: AppTextStyles.body(isDark: widget.isDark),
                decoration: InputDecoration(
                  hintText: 'Banka veya operatör ara',
                  hintStyle: AppTextStyles.bodySecondary(
                    isDark: widget.isDark,
                  ).copyWith(color: AppColors.textSecondaryLight),
                  prefixIcon: Icon(
                    Icons.search,
                    color: AppColors.textSecondary(widget.isDark),
                    size: 20,
                  ),
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 12,
                  ),
                ),
                onChanged: (value) {
                  setState(() {
                    _searchQuery = value;
                  });
                },
              ),
            ),
            const SizedBox(height: 20),

            // Grid - Scrollable
            Expanded(
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // BANKALAR Section
                    if (_banks.isNotEmpty) ...[
                      Padding(
                        padding: const EdgeInsets.only(left: 4, bottom: 12),
                        child: Text(
                          'Bankalar',
                          style: AppTextStyles.sectionTitle(
                            isDark: widget.isDark,
                          ).copyWith(fontSize: 20, fontWeight: FontWeight.w700),
                        ),
                      ),
                      SourceSelectionGrid(
                        sources: _banks,
                        onToggle: _toggleSource,
                        isDark: widget.isDark,
                        crossAxisCount: 2, // 2 sütun grid
                      ),
                      const SizedBox(height: 24),
                    ],

                    // OPERATÖRLER Section
                    if (_operators.isNotEmpty) ...[
                      Padding(
                        padding: const EdgeInsets.only(left: 4, bottom: 12),
                        child: Text(
                          'Operatörler',
                          style: AppTextStyles.sectionTitle(
                            isDark: widget.isDark,
                          ).copyWith(fontSize: 20, fontWeight: FontWeight.w700),
                        ),
                      ),
                      SourceSelectionGrid(
                        sources: _operators,
                        onToggle: _toggleSource,
                        isDark: widget.isDark,
                        crossAxisCount: 2, // 2 sütun grid
                      ),
                    ],
                  ],
                ),
              ),
            ),

            const SizedBox(height: 16),

            // Devam butonu
            SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton(
                onPressed: _hasSelection ? widget.onNext : null,
                style: ElevatedButton.styleFrom(
                  backgroundColor: _hasSelection
                      ? AppColors.primaryLight
                      : AppColors.textSecondaryLight,
                  foregroundColor: Colors.white,
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
                child: Text(
                  'Devam',
                  style: AppTextStyles.button(
                    color: Colors.white,
                  ).copyWith(fontSize: 16, fontWeight: FontWeight.w600),
                ),
              ),
            ),

            // Helper text (buton disabled olduğunda)
            if (!_hasSelection) ...[
              const SizedBox(height: 8),
              Text(
                'En az 1 kaynak seçmelisin',
                style: AppTextStyles.small(
                  isDark: widget.isDark,
                ).copyWith(color: AppColors.textSecondaryLight, fontSize: 12),
                textAlign: TextAlign.center,
              ),
            ],

            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}
