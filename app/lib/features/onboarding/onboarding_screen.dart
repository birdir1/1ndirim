import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/services/preferences_service.dart';
import '../../core/providers/selected_sources_provider.dart';
import '../../data/repositories/source_repository.dart';
import 'pages/value_prop_page.dart';
import 'pages/selection_page.dart';
// V2 için: Aggregation ve Trust page'leri geri eklenebilir
// import 'pages/aggregation_page.dart';
// import 'pages/trust_page.dart';

/// Ana Onboarding Controller
class OnboardingScreen extends StatefulWidget {
  final VoidCallback onComplete;
  final bool isDark;

  const OnboardingScreen({
    super.key,
    required this.onComplete,
    this.isDark = false,
  });

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;
  List<String> _selectedSources = [];

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _goToPage(int page) {
    _pageController.animateToPage(
      page,
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeInOut,
    );
  }

  void _nextPage() {
    if (_currentPage < 1) {
      _goToPage(_currentPage + 1);
    } else {
      // Son sayfada (SelectionPage), onboarding'i tamamla
      _completeOnboarding();
    }
  }

  void _previousPage() {
    if (_currentPage > 0) {
      _goToPage(_currentPage - 1);
    }
  }

  void _onSourcesChanged(List<String> sources) {
    _selectedSources = sources;
  }

  Future<void> _completeOnboarding() async {
    try {
      // Save onboarding completion
      final prefsService = PreferencesService.instance;
      await prefsService.setOnboardingComplete(true);
      // Save selected sources via SourceRepository
      await SourceRepository.saveSelectedSources(_selectedSources);

      if (!mounted) return;

      // Provider'ı refresh et (global state güncelle)
      final sourcesProvider = Provider.of<SelectedSourcesProvider>(
        context,
        listen: false,
      );
      await sourcesProvider.loadSelectedSources();

      if (mounted) {
        widget.onComplete();
      }
    } catch (e) {
      // Hata durumunda da devam et, kullanıcı deneyimini bozma
      if (mounted) {
        widget.onComplete();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    // Provider context'i al (onboarding içinde kullanılabilir)
    return Scaffold(
      body: PageView(
        controller: _pageController,
        physics: const NeverScrollableScrollPhysics(),
        onPageChanged: (page) {
          setState(() {
            _currentPage = page;
          });
        },
        children: [
          // Page 1: Value Proposition
          ValuePropPage(
            onNext: _nextPage,
            onSkip: _completeOnboarding,
            isDark: widget.isDark,
          ),

          // Page 2: Selection
          SelectionPage(
            onNext: _nextPage, // _nextPage artık _completeOnboarding çağıracak
            onBack: _previousPage,
            onSkip: _completeOnboarding,
            onSourcesChanged: _onSourcesChanged,
            isDark: widget.isDark,
          ),
          // V2 için: Aggregation ve Trust page'leri geri eklenebilir
          // AggregationPage(...),
          // TrustPage(...),
        ],
      ),
    );
  }
}
