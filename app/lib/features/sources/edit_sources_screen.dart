import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/utils/page_transitions.dart';
import '../../core/providers/selected_sources_provider.dart';
import '../../data/models/source_model.dart';
import '../../data/repositories/source_repository.dart';
import 'save_confirmation_screen.dart';

class EditSourcesScreen extends StatefulWidget {
  const EditSourcesScreen({super.key});

  @override
  State<EditSourcesScreen> createState() => _EditSourcesScreenState();
}

class _EditSourcesScreenState extends State<EditSourcesScreen> {
  late List<SourceModel> _sources;
  final Set<String> _expandedIds = {};
  bool _hasUnsavedChanges = false;
  bool _isLoading = true;
  bool _isSaving = false;
  List<String> _initialSelectedSources = [];
  List<String> _initialSelectedSegments = [];

  @override
  void initState() {
    super.initState();
    _initializeSources();
  }

  /// Kaynakları başlatır ve seçili durumları yükler
  Future<void> _initializeSources() async {
    // Tüm kaynakları repository'den al
    _sources = SourceRepository.getAllSourcesWithSegments();
    
    // Tüm seçenekleri kapalı başlat (kullanıcı isterse açabilir)
    _expandedIds.clear();
    
    // Repository'den seçili kaynakları yükle
    await _loadSelectedSources();
  }

  /// Repository'den seçili kaynakları yükler ve UI'ı günceller
  Future<void> _loadSelectedSources() async {
    try {
      // Repository'den seçili kaynak ve segment ID'lerini al
      final selectedSourceIds = await SourceRepository.getSelectedSources();
      final selectedSegmentIds = await SourceRepository.getSelectedSegments();
      
      // İlk durumu kaydet (değişiklik kontrolü için)
      _initialSelectedSources = List.from(selectedSourceIds);
      _initialSelectedSegments = List.from(selectedSegmentIds);
      
      if (mounted) {
        setState(() {
          for (var source in _sources) {
            // Önce segmentleri yükle
            for (var segment in source.segments) {
              segment.isSelected = selectedSegmentIds.contains(segment.id);
            }
            
            // Eğer kaynak ID'si seçili listede varsa veya en az bir segment seçiliyse, kaynağı seç
            final hasSelectedSegment = source.segments.any((s) => s.isSelected);
            source.isSelected = selectedSourceIds.contains(source.id) || hasSelectedSegment;
          }
          
          _hasUnsavedChanges = false;
          _isLoading = false;
        });
      }
    } catch (e) {
      // Hata durumunda varsayılan durumla devam et
      if (mounted) {
        setState(() {
          _hasUnsavedChanges = false;
          _isLoading = false;
        });
      }
    }
  }

  /// Mevcut seçimlerin başlangıç durumundan farklı olup olmadığını kontrol eder
  bool _hasUnsavedChangesCheck() {
    // Seçili kaynakları topla
    final currentSelectedSources = _sources
        .where((s) => s.isSelected)
        .map((s) => s.id)
        .toList()
      ..sort();
    
    // Seçili segmentleri topla
    final currentSelectedSegments = <String>[];
    for (var source in _sources) {
      for (var segment in source.segments) {
        if (segment.isSelected) {
          currentSelectedSegments.add(segment.id);
        }
      }
    }
    currentSelectedSegments.sort();
    
    // İlk durumu sırala
    final initialSources = List.from(_initialSelectedSources)..sort();
    final initialSegments = List.from(_initialSelectedSegments)..sort();
    
    // Listeleri karşılaştır
    if (currentSelectedSources.length != initialSources.length ||
        currentSelectedSegments.length != initialSegments.length) {
      return true;
    }
    
    for (int i = 0; i < currentSelectedSources.length; i++) {
      if (currentSelectedSources[i] != initialSources[i]) {
        return true;
      }
    }
    
    for (int i = 0; i < currentSelectedSegments.length; i++) {
      if (currentSelectedSegments[i] != initialSegments[i]) {
        return true;
      }
    }
    
    return false;
  }

  void _toggleExpand(String id) {
    setState(() {
      if (_expandedIds.contains(id)) {
        _expandedIds.remove(id);
      } else {
        _expandedIds.add(id);
      }
    });
  }

  void _toggleSourceSelection(String sourceId) {
    setState(() {
      final source = _sources.firstWhere((s) => s.id == sourceId);
      source.isSelected = !source.isSelected;
      // Eğer kaynak seçiliyse, tüm segmentlerini seç
      if (source.isSelected) {
        for (var segment in source.segments) {
          segment.isSelected = true;
        }
      } else {
        // Eğer kaynak seçili değilse, tüm segmentlerini kaldır
        for (var segment in source.segments) {
          segment.isSelected = false;
        }
      }
      _hasUnsavedChanges = _hasUnsavedChangesCheck();
    });
  }

  void _toggleSegmentSelection(String sourceId, String segmentId) {
    setState(() {
      final source = _sources.firstWhere((s) => s.id == sourceId);
      final segment = source.segments.firstWhere((s) => s.id == segmentId);
      segment.isSelected = !segment.isSelected;
      
      // Eğer en az bir segment seçiliyse, kaynağı da otomatik seç
      final anySelected = source.segments.any((s) => s.isSelected);
      source.isSelected = anySelected;
      
      _hasUnsavedChanges = _hasUnsavedChangesCheck();
    });
  }

  /// Değişiklikleri kaydeder - Repository üzerinden kalıcı hale getirir
  Future<void> _saveChanges() async {
    if (_isLoading || _isSaving) return;
    
    setState(() {
      _isSaving = true;
    });
    
    try {
      // Seçili ana kaynakların id'lerini topla
      final selectedSources = _sources
          .where((s) => s.isSelected)
          .map((s) => s.id)
          .toList();
      
      // Seçili alt segmentlerin id'lerini topla
      final selectedSegments = <String>[];
      for (var source in _sources) {
        for (var segment in source.segments) {
          if (segment.isSelected) {
            selectedSegments.add(segment.id);
          }
        }
      }
      
      // Repository üzerinden kaydet
      final sourcesSuccess = await SourceRepository.saveSelectedSources(selectedSources);
      final segmentsSuccess = await SourceRepository.saveSelectedSegments(selectedSegments);
      
      if (sourcesSuccess && segmentsSuccess) {
        // Başlangıç durumunu güncelle (değişiklik kontrolü için)
        if (mounted) {
          setState(() {
            _initialSelectedSources = List.from(selectedSources);
            _initialSelectedSegments = List.from(selectedSegments);
            _hasUnsavedChanges = false;
            _isSaving = false;
            // Kaydetme sonrası tüm açık seçenekleri kapat
            _expandedIds.clear();
          });
          
          // Provider'ı refresh et (global state güncelle)
          final sourcesProvider = Provider.of<SelectedSourcesProvider>(context, listen: false);
          await sourcesProvider.loadSelectedSources();
          
          // Onay ekranına git
          Navigator.of(context).pushReplacement(
            SlidePageRoute(
              child: const SaveConfirmationScreen(),
              direction: SlideDirection.right,
            ),
          );
        }
      } else {
        // Hata durumunda kullanıcıya bilgi ver
        if (mounted) {
          setState(() {
            _isSaving = false;
          });
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Kayıt sırasında bir hata oluştu'),
              backgroundColor: AppColors.error,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isSaving = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Bir hata oluştu: ${e.toString()}'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  /// Geri butonuna basıldığında çağrılır - değişiklik kontrolü yapar
  Future<bool> _onWillPop() async {
    if (!_hasUnsavedChanges) {
      return true;
    }

    final shouldPop = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.cardBackground,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        title: Text(
          'Değişiklikler kaydedilmedi',
          style: AppTextStyles.sectionTitle(isDark: false),
        ),
        content: Text(
          'Yaptığın değişiklikler kaydedilmedi. Çıkmak istediğinden emin misin?',
          style: AppTextStyles.caption(isDark: false),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: Text(
              'İptal',
              style: AppTextStyles.caption(isDark: false).copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: Text(
              'Çık',
              style: AppTextStyles.caption(isDark: false).copyWith(
                fontWeight: FontWeight.w600,
                color: AppColors.error,
              ),
            ),
          ),
        ],
      ),
    );

    return shouldPop ?? false;
  }

  List<SourceModel> get _banks {
    return _sources.where((s) => s.type == 'bank').toList();
  }

  List<SourceModel> get _operators {
    return _sources.where((s) => s.type == 'operator').toList();
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        backgroundColor: AppColors.backgroundLight,
        appBar: AppBar(
          backgroundColor: AppColors.backgroundLight,
          elevation: 0,
          leading: IconButton(
            icon: Icon(
              Icons.arrow_back_ios_new,
              color: AppColors.textPrimaryLight,
              size: 20,
            ),
            onPressed: () => Navigator.of(context).pop(),
          ),
          centerTitle: true,
          title: Text(
            'Kaynaklarımı Düzenle',
            style: AppTextStyles.pageTitle(isDark: false),
          ),
        ),
        body: const Center(
          child: CircularProgressIndicator(
            color: AppColors.primaryLight,
          ),
        ),
      );
    }

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) async {
        if (!didPop) {
          final shouldPop = await _onWillPop();
          if (shouldPop && mounted) {
            Navigator.of(context).pop();
          }
        }
      },
      child: Scaffold(
        backgroundColor: AppColors.backgroundLight, // #FFF2C6
        appBar: AppBar(
          backgroundColor: AppColors.backgroundLight,
          elevation: 0,
          leading: IconButton(
            icon: Icon(
              Icons.arrow_back_ios_new,
              color: AppColors.textPrimaryLight,
              size: 20,
            ),
            onPressed: () async {
              final shouldPop = await _onWillPop();
              if (shouldPop && mounted) {
                Navigator.of(context).pop();
              }
            },
          ),
        centerTitle: true,
        title: Text(
          'Kaynaklarımı Düzenle',
          style: AppTextStyles.pageTitle(isDark: false),
        ),
        actions: [
          if (_isSaving)
            const Padding(
              padding: EdgeInsets.all(16.0),
              child: SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: AppColors.primaryLight,
                ),
              ),
            )
          else
            TextButton(
              onPressed: _hasUnsavedChanges ? _saveChanges : null,
              child: Text(
                'Kaydet',
                style: AppTextStyles.button(
                  color: _hasUnsavedChanges
                      ? AppColors.primaryLight
                      : AppColors.textSecondaryLight,
                ),
              ),
            ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // BANKALAR Section
            Padding(
              padding: const EdgeInsets.only(left: 4, top: 8, bottom: 8),
              child: Text(
                'Bankalar',
                style: AppTextStyles.sectionTitle(isDark: false),
              ),
            ),
            ..._banks.map((source) => RepaintBoundary(
                  child: _buildSourceAccordion(source),
                )),
            
            const SizedBox(height: 24),
            
            // OPERATÖRLER Section
            Padding(
              padding: const EdgeInsets.only(left: 4, top: 8, bottom: 8),
              child: Text(
                'Operatörler',
                style: AppTextStyles.sectionTitle(isDark: false),
              ),
            ),
            ..._operators.map((source) => RepaintBoundary(
                  child: _buildSourceAccordion(source),
                )),
            
            const SizedBox(height: 16),
            
            // Info Text
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4),
              child: Text(
                'Alt seçimler, sana uygun kampanyaları daha doğru göstermemizi sağlar.',
                style: AppTextStyles.caption(isDark: false).copyWith(
                  fontSize: 12,
                  color: AppColors.textSecondaryLight,
                ),
                textAlign: TextAlign.center,
              ),
            ),
            
            const SizedBox(height: 24),
          ],
        ),
      ),
      ),
    );
  }

  Widget _buildSourceAccordion(SourceModel source) {
    final isExpanded = _expandedIds.contains(source.id);
    final hasSegments = source.segments.isNotEmpty;
    
    return Container(
      margin: const EdgeInsets.only(bottom: 6),
      decoration: BoxDecoration(
        color: AppColors.cardBackground,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: AppColors.divider.withOpacity(0.2),
          width: 1,
        ),
      ),
      child: Theme(
        data: Theme.of(context).copyWith(
          dividerColor: Colors.transparent,
          expansionTileTheme: ExpansionTileThemeData(
            backgroundColor: Colors.transparent,
            collapsedBackgroundColor: Colors.transparent,
            iconColor: AppColors.textSecondaryLight,
            collapsedIconColor: AppColors.textSecondaryLight,
          ),
        ),
        child: ExpansionTile(
          key: ValueKey('${source.id}_$isExpanded'),
          initiallyExpanded: isExpanded,
          onExpansionChanged: hasSegments ? (expanded) => _toggleExpand(source.id) : null,
          tilePadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
          childrenPadding: EdgeInsets.zero,
          leading: Checkbox(
            value: source.isSelected,
            onChanged: (value) => _toggleSourceSelection(source.id),
            activeColor: AppColors.secondaryLight,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(4),
            ),
            materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
            visualDensity: VisualDensity.compact,
          ),
          title: Row(
            children: [
              _buildLogo(source),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  source.name,
                  style: AppTextStyles.body(isDark: false).copyWith(
                    fontSize: 15,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ],
          ),
          trailing: hasSegments
              ? Icon(
                  isExpanded ? Icons.expand_less : Icons.expand_more,
                  color: AppColors.textSecondaryLight,
                  size: 20,
                )
              : const SizedBox.shrink(),
          children: hasSegments
              ? [
                  Divider(
                    height: 1,
                    thickness: 1,
                    color: AppColors.divider.withOpacity(0.2),
                    indent: 12,
                    endIndent: 12,
                  ),
                  Padding(
                    padding: const EdgeInsets.only(left: 12, right: 12, top: 4, bottom: 8),
                    child: Column(
                      children: source.segments.map((segment) {
                        return RepaintBoundary(
                          child: Padding(
                            padding: const EdgeInsets.symmetric(vertical: 3),
                            child: Row(
                              children: [
                                const SizedBox(width: 40),
                                Checkbox(
                                  value: segment.isSelected,
                                  onChanged: (value) => _toggleSegmentSelection(source.id, segment.id),
                                  activeColor: AppColors.secondaryLight,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                  visualDensity: VisualDensity.compact,
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    segment.name,
                                    style: AppTextStyles.caption(isDark: false).copyWith(
                                      color: AppColors.textPrimaryLight,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                ]
              : [],
        ),
      ),
    );
  }

  /// Logo görselini gösterir - gerçek logolar (PNG veya SVG) - büyük versiyon
  Widget _buildLogo(SourceModel source) {
    final logoSvgPath = 'assets/images/logos/${source.id}.svg';
    final logoPngPath = 'assets/images/logos/${source.id}.png';
    
    return Container(
      width: 50,
      height: 50,
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        // Şeffaf arka plan sorununu çözmek için beyaz arka plan
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Center(
        child: _buildLogoImage(logoSvgPath, logoPngPath, source, isExpanded: false),
      ),
    );
  }

  /// Logo görselini yükler (SVG öncelikli, PNG fallback)
  Widget _buildLogoImage(String svgPath, String pngPath, SourceModel source, {bool isExpanded = false}) {
    // Önce SVG dosyasının var olup olmadığını kontrol et
    // SVG yoksa direkt PNG'ye geç
    return FutureBuilder<String?>(
      future: _checkAssetExists(svgPath),
      builder: (context, snapshot) {
        // SVG dosyası varsa SVG göster
        if (snapshot.hasData && snapshot.data != null) {
          try {
            return Center(
              child: SvgPicture.asset(
                svgPath,
                fit: BoxFit.contain,
                placeholderBuilder: (context) => _buildPngOrFallback(pngPath, source, isExpanded: isExpanded),
                // allowDrawingOutsideViewBox: true, // SVG uyarılarını azaltır
              ),
            );
          } catch (e) {
            // SVG yükleme hatası durumunda PNG'ye geç (sessizce)
            return _buildPngOrFallback(pngPath, source, isExpanded: isExpanded);
          }
        }
        // SVG yoksa direkt PNG'ye geç
        return _buildPngOrFallback(pngPath, source, isExpanded: isExpanded);
      },
    );
  }

  /// Asset dosyasının var olup olmadığını kontrol eder
  Future<String?> _checkAssetExists(String path) async {
    try {
      await rootBundle.loadString(path);
      return path; // Dosya varsa path döndür
    } catch (e) {
      // SVG yoksa sessizce null döndür (PNG fallback kullanılacak)
      return null;
    }
  }

  /// PNG'yi dene, yoksa fallback icon göster
  Widget _buildPngOrFallback(String pngPath, SourceModel source, {bool isExpanded = false}) {
    return Center(
      child: Image.asset(
        pngPath,
        fit: BoxFit.contain,
        filterQuality: FilterQuality.high,
        errorBuilder: (context, error, stackTrace) {
          // Logo yoksa fallback icon göster (sessizce)
          return Container(
            width: 50,
            height: 50,
            decoration: BoxDecoration(
              color: source.color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              source.icon,
              color: source.color,
              size: 28,
            ),
          );
        },
      ),
    );
  }
}
