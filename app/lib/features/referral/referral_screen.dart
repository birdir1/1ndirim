import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/providers/referral_provider.dart';

/// Referans Programı Ekranı
class ReferralScreen extends StatefulWidget {
  const ReferralScreen({super.key});

  @override
  State<ReferralScreen> createState() => _ReferralScreenState();
}

class _ReferralScreenState extends State<ReferralScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadData();
    });
  }

  Future<void> _loadData() async {
    final provider = context.read<ReferralProvider>();
    await Future.wait([provider.loadReferralCode(), provider.loadStats()]);
  }

  Future<void> _copyReferralCode(String code) async {
    await Clipboard.setData(ClipboardData(text: code));
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

  Future<void> _shareReferralCode(String code) async {
    try {
      await Share.share(
        '1ndirim uygulamasını denemek için referans kodumu kullan: $code\n\nKampanyalardan haberdar olmak ve tasarruf etmek için 1ndirim\'i indir!',
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
          'Arkadaşını Davet Et',
          style: AppTextStyles.headline(isDark: false),
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
      body: Consumer<ReferralProvider>(
        builder: (context, provider, _) {
          if (provider.isLoading && provider.referralCode == null) {
            return const Center(
              child: CircularProgressIndicator(color: AppColors.primaryLight),
            );
          }

          return RefreshIndicator(
            onRefresh: _loadData,
            color: AppColors.primaryLight,
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              physics: const AlwaysScrollableScrollPhysics(),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Referans Kodu Kartı
                  _buildReferralCodeCard(provider),

                  const SizedBox(height: 24),

                  // İstatistikler
                  if (provider.stats != null) _buildStatsSection(provider),

                  const SizedBox(height: 24),

                  // Nasıl Çalışır?
                  _buildHowItWorksSection(),

                  const SizedBox(height: 24),

                  // Ödüller
                  _buildRewardsSection(),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildReferralCodeCard(ReferralProvider provider) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppColors.primaryLight,
            AppColors.primaryLight.withValues(alpha: 0.8),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: AppColors.primaryLight.withValues(alpha: 0.3),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        children: [
          const Icon(Icons.card_giftcard, size: 48, color: Colors.white),
          const SizedBox(height: 16),
          Text(
            'Senin Referans Kodun',
            style: AppTextStyles.body(isDark: false).copyWith(
              color: Colors.white.withValues(alpha: 0.9),
              fontSize: 16,
            ),
          ),
          const SizedBox(height: 12),
          if (provider.referralCode != null) ...[
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                provider.referralCode!,
                style: AppTextStyles.headline(isDark: false).copyWith(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 4,
                  color: AppColors.primaryLight,
                ),
              ),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () => _copyReferralCode(provider.referralCode!),
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
                    onPressed: () => _shareReferralCode(provider.referralCode!),
                    icon: const Icon(Icons.share, size: 20),
                    label: const Text('Paylaş'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white.withValues(alpha: 0.2),
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
            const CircularProgressIndicator(color: Colors.white),
          ],
        ],
      ),
    );
  }

  Widget _buildStatsSection(ReferralProvider provider) {
    final stats = provider.stats!;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'İstatistikler',
          style: AppTextStyles.headline(isDark: false).copyWith(fontSize: 20),
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: _buildStatCard(
                'Toplam Davet',
                '${stats.totalReferrals}',
                Icons.people,
                AppColors.primaryLight,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildStatCard(
                'Tamamlanan',
                '${stats.completedReferrals}',
                Icons.check_circle,
                AppColors.success,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _buildStatCard(
                'Bekleyen',
                '${stats.pendingReferrals}',
                Icons.pending,
                AppColors.warning,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildStatCard(
                'Toplam Puan',
                '${stats.totalRewards}',
                Icons.stars,
                AppColors.accent,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildStatCard(
    String title,
    String value,
    IconData icon,
    Color color,
  ) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.cardBackground,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: AppColors.shadowDark.withValues(alpha: 0.1),
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
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: color, size: 24),
          ),
          const SizedBox(height: 12),
          Text(
            value,
            style: AppTextStyles.headline(
              isDark: false,
            ).copyWith(fontSize: 24, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 4),
          Text(
            title,
            style: AppTextStyles.body(
              isDark: false,
            ).copyWith(color: AppColors.textSecondaryLight, fontSize: 12),
          ),
        ],
      ),
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
              Icon(Icons.info_outline, color: AppColors.primaryLight, size: 24),
              const SizedBox(width: 8),
              Text(
                'Nasıl Çalışır?',
                style: AppTextStyles.headline(
                  isDark: false,
                ).copyWith(fontSize: 18),
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
            'Her davet için 100 puan kazanın! Arkadaşınız da 50 puan kazanır.',
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
              style: AppTextStyles.body(
                isDark: false,
              ).copyWith(color: Colors.white, fontWeight: FontWeight.bold),
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
                style: AppTextStyles.body(
                  isDark: false,
                ).copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 4),
              Text(
                description,
                style: AppTextStyles.caption(
                  isDark: false,
                ).copyWith(color: AppColors.textSecondaryLight),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildRewardsSection() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppColors.accent.withValues(alpha: 0.1),
            AppColors.warning.withValues(alpha: 0.1),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: AppColors.accent.withValues(alpha: 0.3),
          width: 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.emoji_events, color: AppColors.accent, size: 24),
              const SizedBox(width: 8),
              Text(
                'Ödüller',
                style: AppTextStyles.headline(
                  isDark: false,
                ).copyWith(fontSize: 18),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _buildRewardItem(
            Icons.person_add,
            'Davet Eden (Sen)',
            '+100 puan',
            AppColors.primaryLight,
          ),
          const SizedBox(height: 12),
          _buildRewardItem(
            Icons.person,
            'Davet Edilen (Arkadaşın)',
            '+50 puan',
            AppColors.success,
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.info.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: [
                Icon(Icons.lightbulb_outline, color: AppColors.info, size: 20),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Puanlar şu an sadece takip ediliyor. Yakında kullanılabilir hale gelecek!',
                    style: AppTextStyles.caption(
                      isDark: false,
                    ).copyWith(color: AppColors.info),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRewardItem(
    IconData icon,
    String title,
    String reward,
    Color color,
  ) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: color, size: 20),
        ),
        const SizedBox(width: 12),
        Expanded(child: Text(title, style: AppTextStyles.body(isDark: false))),
        Text(
          reward,
          style: AppTextStyles.body(
            isDark: false,
          ).copyWith(fontWeight: FontWeight.bold, color: color),
        ),
      ],
    );
  }
}
