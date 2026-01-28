import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:share_plus/share_plus.dart';
import 'package:intl/intl.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/utils/network_result.dart';
import '../../data/repositories/referral_repository.dart';
import '../../data/models/referral_stats_model.dart';
import '../../core/widgets/empty_state.dart';

/// Referans Programı Ekranı
class ReferralScreen extends StatefulWidget {
  const ReferralScreen({super.key});

  @override
  State<ReferralScreen> createState() => _ReferralScreenState();
}

class _ReferralScreenState extends State<ReferralScreen> {
  final ReferralRepository _repository = ReferralRepository();
  NetworkResult<ReferralStatsModel>? _statsResult;
  ReferralStatsModel? _stats;
  String? _referralCode;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    if (_isLoading) return;

    setState(() {
      _isLoading = true;
    });

    final codeResult = await _repository.getReferralCode();
    final statsResult = await _repository.getReferralStats();

    if (mounted) {
      setState(() {
        _isLoading = false;
        _statsResult = statsResult;

        if (codeResult is NetworkSuccess) {
          _referralCode = codeResult.data;
        }

        if (statsResult is NetworkSuccess) {
          _stats = statsResult.data;
          _referralCode ??= _stats?.referralCode;
        }
      });
    }
  }

  Future<void> _copyReferralCode() async {
    if (_referralCode == null) return;

    await Clipboard.setData(ClipboardData(text: _referralCode!));
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Referans kodu kopyalandı!'),
          backgroundColor: AppColors.success,
          duration: const Duration(seconds: 2),
        ),
      );
    }
  }

  Future<void> _shareReferralCode() async {
    if (_referralCode == null) return;

    try {
      await Share.share(
        '1ndirim uygulamasını denemek için referans kodumu kullan: $_referralCode\n\nKampanyalardan haberdar olmak ve tasarruf etmek için 1ndirim\'i indir!',
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Paylaşım hatası: ${e.toString()}'),
            backgroundColor: AppColors.error,
          ),
        );
      }
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
          'Referans Programı',
          style: AppTextStyles.heading(isDark: false),
        ),
        centerTitle: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: AppColors.textPrimaryLight),
            onPressed: _loadData,
            tooltip: 'Yenile',
          ),
        ],
      ),
      body: _isLoading && _stats == null
          ? const Center(
              child: CircularProgressIndicator(
                color: AppColors.primaryLight,
              ),
            )
          : RefreshIndicator(
              onRefresh: _loadData,
              color: AppColors.primaryLight,
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Referans Kodu Kartı
                    _buildReferralCodeCard(),

                    const SizedBox(height: 24),

                    // İstatistikler
                    if (_stats != null) _buildStatsSection(),

                    const SizedBox(height: 24),

                    // Son Referanslar
                    if (_stats != null && _stats!.recentReferrals.isNotEmpty)
                      _buildRecentReferralsSection(),

                    const SizedBox(height: 24),

                    // Nasıl Çalışır?
                    _buildHowItWorksSection(),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildReferralCodeCard() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppColors.primaryLight,
            AppColors.primaryLight.withOpacity(0.8),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: AppColors.primaryLight.withOpacity(0.3),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        children: [
          const Icon(
            Icons.card_giftcard,
            size: 48,
            color: Colors.white,
          ),
          const SizedBox(height: 16),
          Text(
            'Referans Kodunuz',
            style: AppTextStyles.body(isDark: false).copyWith(
              color: Colors.white.withOpacity(0.9),
              fontSize: 16,
            ),
          ),
          const SizedBox(height: 12),
          if (_referralCode != null) ...[
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                _referralCode!,
                style: AppTextStyles.heading(isDark: false).copyWith(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 2,
                  color: AppColors.primaryLight,
                ),
              ),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: _copyReferralCode,
                    icon: const Icon(Icons.copy, size: 20),
                    label: const Text('Kopyala'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: AppColors.primaryLight,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: _shareReferralCode,
                    icon: const Icon(Icons.share, size: 20),
                    label: const Text('Paylaş'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white.withOpacity(0.2),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                        side: const BorderSide(color: Colors.white, width: 1),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ] else ...[
            const CircularProgressIndicator(
              color: Colors.white,
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildStatsSection() {
    if (_stats == null) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'İstatistikler',
          style: AppTextStyles.heading(isDark: false).copyWith(
            fontSize: 20,
          ),
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: _buildStatCard(
                'Toplam Davet',
                '${_stats!.totalReferrals}',
                Icons.people,
                AppColors.primaryLight,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildStatCard(
                'Kazanılan Puan',
                '${_stats!.totalPoints}',
                Icons.stars,
                AppColors.warning,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.cardBackground,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: AppColors.shadowDark.withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: color, size: 24),
          ),
          const SizedBox(height: 12),
          Text(
            value,
            style: AppTextStyles.heading(isDark: false).copyWith(
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            title,
            style: AppTextStyles.body(isDark: false).copyWith(
              color: AppColors.textSecondaryLight,
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRecentReferralsSection() {
    if (_stats == null || _stats!.recentReferrals.isEmpty) {
      return const SizedBox.shrink();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Son Referanslar',
          style: AppTextStyles.heading(isDark: false).copyWith(
            fontSize: 20,
          ),
        ),
        const SizedBox(height: 16),
        ..._stats!.recentReferrals.map((referral) {
          return Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.cardBackground,
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                  color: AppColors.shadowDark.withOpacity(0.05),
                  blurRadius: 4,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: AppColors.primaryLight.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(
                    Icons.person,
                    color: AppColors.primaryLight,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Davet edilen kullanıcı',
                        style: AppTextStyles.body(isDark: false).copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        DateFormat('dd MMM yyyy, HH:mm', 'tr_TR')
                            .format(referral.createdAt),
                        style: AppTextStyles.caption(isDark: false).copyWith(
                          color: AppColors.textSecondaryLight,
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: AppColors.success.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    '+${referral.rewardPoints} puan',
                    style: AppTextStyles.caption(isDark: false).copyWith(
                      color: AppColors.success,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
          );
        }).toList(),
      ],
    );
  }

  Widget _buildHowItWorksSection() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surfaceLight,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.info_outline,
                color: AppColors.primaryLight,
                size: 24,
              ),
              const SizedBox(width: 8),
              Text(
                'Nasıl Çalışır?',
                style: AppTextStyles.heading(isDark: false).copyWith(
                  fontSize: 18,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _buildHowItWorksItem(
            '1',
            'Referans kodunuzu paylaşın',
            'Arkadaşlarınızla referans kodunuzu paylaşın',
          ),
          const SizedBox(height: 12),
          _buildHowItWorksItem(
            '2',
            'Arkadaşınız kayıt olsun',
            'Arkadaşınız kayıt olurken referans kodunuzu kullansın',
          ),
          const SizedBox(height: 12),
          _buildHowItWorksItem(
            '3',
            'Ödül kazanın',
            'Her davet için 50 puan kazanın! Arkadaşınız da 25 puan kazanır.',
          ),
        ],
      ),
    );
  }

  Widget _buildHowItWorksItem(String number, String title, String description) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: AppColors.primaryLight,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Center(
            child: Text(
              number,
              style: AppTextStyles.body(isDark: false).copyWith(
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: AppTextStyles.body(isDark: false).copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                description,
                style: AppTextStyles.caption(isDark: false).copyWith(
                  color: AppColors.textSecondaryLight,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
