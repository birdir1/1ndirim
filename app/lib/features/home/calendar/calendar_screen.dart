import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:provider/provider.dart';
import 'package:table_calendar/table_calendar.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/page_transitions.dart';
import '../../../core/utils/network_result.dart';
import '../../../core/utils/tag_normalizer.dart';
import '../../../core/providers/selected_sources_provider.dart';
import '../../../data/models/opportunity_model.dart';
import '../../../data/repositories/favorite_repository.dart';
import '../../../data/repositories/opportunity_repository.dart';
import '../widgets/opportunity_card_v2.dart';
import '../campaign_detail_screen.dart';

/// Kampanya Takvimi Ekranı
/// Tarih seçildiğinde o tarihte bitecek kampanyaları gösterir
class CalendarScreen extends StatefulWidget {
  const CalendarScreen({super.key});

  @override
  State<CalendarScreen> createState() => _CalendarScreenState();
}

class _CalendarScreenState extends State<CalendarScreen> {
  DateTime _focusedDay = DateTime.now();
  DateTime _selectedDay = DateTime.now();
  CalendarFormat _calendarFormat = CalendarFormat.month;

  NetworkResult<List<OpportunityModel>> _campaignsResult =
      const NetworkLoading();
  List<OpportunityModel> _campaigns = [];
  bool _isLoading = false;

  final OpportunityRepository _opportunityRepository =
      OpportunityRepository.instance;
  final FavoriteRepository _favoriteRepository = FavoriteRepository.instance;
  FirebaseAuth? get _auth {
    try {
      return FirebaseAuth.instance;
    } catch (_) {
      return null;
    }
  }

  Map<String, bool> _favoriteMap = {};
  String? _favoriteMapKey;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadCampaignsForDate(_selectedDay);
    });
  }

  /// Seçili tarihte bitecek kampanyaları yükler
  Future<void> _loadCampaignsForDate(DateTime date) async {
    if (!mounted || _isLoading) return;

    setState(() {
      _isLoading = true;
      _campaignsResult = const NetworkLoading();
    });

    final sourcesProvider = Provider.of<SelectedSourcesProvider>(
      context,
      listen: false,
    );
    final selectedSourceNames = sourcesProvider.getSelectedSourceNames();

    try {
      // Tarih aralığı: seçili günün başından sonuna kadar
      final selectedDate = DateTime(date.year, date.month, date.day);

      // Backend'de findByDateRange kullanmak yerine, tüm aktif kampanyaları alıp
      // expiresAt'e göre filtreleyelim (daha basit)
      final result = await _opportunityRepository.getOpportunitiesBySources(
        selectedSourceNames.isNotEmpty ? selectedSourceNames : [],
      );

      if (mounted) {
        if (result is NetworkSuccess<List<OpportunityModel>>) {
          // Seçili tarihte bitecek kampanyaları filtrele
          final filteredCampaigns = result.data.where((campaign) {
            if (campaign.expiresAt == null) return false;
            try {
              final expiresAt = DateTime.parse(campaign.expiresAt!);
              // Seçili günün başı ve sonu arasında bitecek kampanyalar
              return expiresAt.year == selectedDate.year &&
                  expiresAt.month == selectedDate.month &&
                  expiresAt.day == selectedDate.day;
            } catch (e) {
              return false;
            }
          }).toList();

          setState(() {
            _campaigns = filteredCampaigns;
            _campaignsResult = NetworkSuccess(filteredCampaigns);
            _isLoading = false;
          });
          _prefetchFavorites();
        } else {
          setState(() {
            _campaignsResult = result;
            _isLoading = false;
          });
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _campaignsResult = NetworkError.general(
            'Kampanyalar yüklenirken bir hata oluştu',
          );
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _prefetchFavorites() async {
    if (!mounted) return;
    if (_auth?.currentUser == null) {
      if (_favoriteMap.isNotEmpty) {
        setState(() {
          _favoriteMap = {};
          _favoriteMapKey = null;
        });
      }
      return;
    }

    final ids = _campaigns.map((e) => e.id).toList();
    final desiredKey =
        '${_selectedDay.toIso8601String().substring(0, 10)}_${ids.length}_${ids.isNotEmpty ? ids.first : ''}_${ids.isNotEmpty ? ids.last : ''}';
    if (_favoriteMapKey == desiredKey) return;
    if (ids.isEmpty) {
      if (_favoriteMap.isNotEmpty) {
        setState(() {
          _favoriteMap = {};
          _favoriteMapKey = desiredKey;
        });
      } else {
        _favoriteMapKey = desiredKey;
      }
      return;
    }

    final map = await _favoriteRepository.checkFavorites(ids);
    if (!mounted) return;
    setState(() {
      _favoriteMap = map;
      _favoriteMapKey = desiredKey;
    });
  }

  /// Tarih seçildiğinde çağrılır
  void _onDaySelected(DateTime selectedDay, DateTime focusedDay) {
    if (!isSameDay(_selectedDay, selectedDay)) {
      setState(() {
        _selectedDay = selectedDay;
        _focusedDay = focusedDay;
      });
      _loadCampaignsForDate(selectedDay);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      appBar: AppBar(
        backgroundColor: AppColors.backgroundLight,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.textPrimaryLight),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text(
          'Kampanya Takvimi',
          style: AppTextStyles.headline(isDark: false),
        ),
        centerTitle: false,
      ),
      body: Column(
        children: [
          // Takvim Widget
          Container(
            margin: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: AppColors.shadowDark.withValues(alpha: 0.1),
                  blurRadius: 10,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: TableCalendar<dynamic>(
              firstDay: DateTime.now().subtract(const Duration(days: 365)),
              lastDay: DateTime.now().add(const Duration(days: 365)),
              focusedDay: _focusedDay,
              selectedDayPredicate: (day) => isSameDay(_selectedDay, day),
              calendarFormat: _calendarFormat,
              onFormatChanged: (format) {
                if (_calendarFormat != format) {
                  setState(() {
                    _calendarFormat = format;
                  });
                }
              },
              onDaySelected: _onDaySelected,
              onPageChanged: (focusedDay) {
                _focusedDay = focusedDay;
              },
              calendarStyle: CalendarStyle(
                outsideDaysVisible: false,
                weekendTextStyle: AppTextStyles.body(
                  isDark: false,
                ).copyWith(color: AppColors.textSecondaryLight),
                defaultTextStyle: AppTextStyles.body(isDark: false),
                selectedDecoration: BoxDecoration(
                  color: AppColors.primaryLight,
                  shape: BoxShape.circle,
                ),
                todayDecoration: BoxDecoration(
                  color: AppColors.primaryLight.withValues(alpha: 0.3),
                  shape: BoxShape.circle,
                ),
                selectedTextStyle: AppTextStyles.body(
                  isDark: false,
                ).copyWith(color: Colors.white, fontWeight: FontWeight.bold),
                todayTextStyle: AppTextStyles.body(isDark: false).copyWith(
                  color: AppColors.primaryLight,
                  fontWeight: FontWeight.bold,
                ),
              ),
              headerStyle: HeaderStyle(
                formatButtonVisible: true,
                titleCentered: false,
                formatButtonShowsNext: false,
                formatButtonDecoration: BoxDecoration(
                  color: AppColors.primaryLight,
                  borderRadius: BorderRadius.circular(8),
                ),
                formatButtonTextStyle: AppTextStyles.caption(
                  isDark: false,
                ).copyWith(color: Colors.white),
                leftChevronIcon: Icon(
                  Icons.chevron_left,
                  color: AppColors.textPrimaryLight,
                ),
                rightChevronIcon: Icon(
                  Icons.chevron_right,
                  color: AppColors.textPrimaryLight,
                ),
              ),
            ),
          ),

          // Seçili Tarih Bilgisi
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Row(
              children: [
                Icon(
                  Icons.calendar_today,
                  size: 16,
                  color: AppColors.textSecondaryLight,
                ),
                const SizedBox(width: 8),
                Text(
                  DateFormat('d MMMM yyyy', 'tr_TR').format(_selectedDay),
                  style: AppTextStyles.body(isDark: false).copyWith(
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimaryLight,
                  ),
                ),
                const Spacer(),
                Text(
                  '${_campaigns.length} kampanya',
                  style: AppTextStyles.caption(
                    isDark: false,
                  ).copyWith(color: AppColors.textSecondaryLight),
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Kampanya Listesi
          Expanded(child: _buildCampaignsList()),
        ],
      ),
    );
  }

  Widget _buildCampaignsList() {
    if (_campaignsResult is NetworkLoading) {
      return const Center(
        child: CircularProgressIndicator(color: AppColors.primaryLight),
      );
    }

    if (_campaignsResult is NetworkError) {
      final error = _campaignsResult as NetworkError;
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 48, color: AppColors.error),
            const SizedBox(height: 16),
            Text(
              error.message,
              style: AppTextStyles.body(
                isDark: false,
              ).copyWith(color: AppColors.textSecondaryLight),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => _loadCampaignsForDate(_selectedDay),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primaryLight,
              ),
              child: const Text('Tekrar Dene'),
            ),
          ],
        ),
      );
    }

    if (_campaigns.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.event_busy,
              size: 48,
              color: AppColors.textSecondaryLight,
            ),
            const SizedBox(height: 16),
            Text(
              'Bu tarihte bitecek kampanya yok',
              style: AppTextStyles.body(
                isDark: false,
              ).copyWith(color: AppColors.textSecondaryLight),
            ),
            const SizedBox(height: 8),
            Text(
              'Başka bir tarih seçmeyi deneyin',
              style: AppTextStyles.caption(
                isDark: false,
              ).copyWith(color: AppColors.textSecondaryLight),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(24, 0, 24, 24),
      itemCount: _campaigns.length,
      itemBuilder: (context, index) {
        final campaign = _campaigns[index];
        return Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: InkWell(
            onTap: () {
              Navigator.of(context).push(
                SlidePageRoute(
                  child: CampaignDetailScreen.fromOpportunity(
                    opportunity: campaign,
                    primaryTag: TagNormalizer.normalize(campaign.tags).primary,
                  ),
                  direction: SlideDirection.left,
                ),
              );
            },
            borderRadius: BorderRadius.circular(20),
            child: OpportunityCardV2(
              opportunity: campaign,
              isFavorite: _favoriteMap[campaign.id],
            ),
          ),
        );
      },
    );
  }
}
