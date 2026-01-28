import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/utils/network_result.dart';
import '../../data/repositories/premium_repository.dart';
import '../../data/models/premium_plan_model.dart';
import '../../data/models/premium_feature_model.dart';
import '../../data/models/premium_subscription_model.dart';

/// Premium Üyelik Ekranı
class PremiumScreen extends StatefulWidget {
  const PremiumScreen({super.key});

  @override
  State<PremiumScreen> createState() => _PremiumScreenState();
}

class _PremiumScreenState extends State<PremiumScreen> {
  final PremiumRepository _repository = PremiumRepository();
  NetworkResult<Map<String, dynamic>>? _statusResult;
  NetworkResult<List<PremiumPlanModel>>? _plansResult;
  NetworkResult<List<PremiumFeatureModel>>? _featuresResult;
  
  bool? _isPremium;
  PremiumSubscriptionModel? _subscription;
  List<PremiumPlanModel> _plans = [];
  List<PremiumFeatureModel> _features = [];
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

    final statusResult = await _repository.getPremiumStatus();
    final plansResult = await _repository.getPlans();
    final featuresResult = await _repository.getFeatures();

    if (mounted) {
      setState(() {
        _isLoading = false;
        _statusResult = statusResult;
        _plansResult = plansResult;
        _featuresResult = featuresResult;

        if (statusResult is NetworkSuccess) {
          _isPremium = statusResult.data['isPremium'] as bool? ?? false;
          if (statusResult.data['subscription'] != null) {
            _subscription = PremiumSubscriptionModel.fromMap(
              statusResult.data['subscription'] as Map<String, dynamic>,
            );
          }
        }

        if (plansResult is NetworkSuccess) {
          _plans = plansResult.data;
        }

        if (featuresResult is NetworkSuccess) {
          _features = featuresResult.data;
        }
      });
    }
  }

  Future<void> _subscribeToPlan(String planType) async {
    if (_isLoading) return;

    setState(() {
      _isLoading = true;
    });

    final result = await _repository.subscribe(planType, durationDays: planType == 'yearly' ? 365 : 30);

    if (mounted) {
      setState(() {
        _isLoading = false;
      });

      if (result is NetworkSuccess) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Premium üyelik aktif edildi!'),
            backgroundColor: AppColors.success,
          ),
        );
        _loadData();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result is NetworkError ? result.message : 'Bir hata oluştu'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  Future<void> _cancelSubscription() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Aboneliği İptal Et'),
        content: const Text('Premium aboneliğinizi iptal etmek istediğinize emin misiniz?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Hayır'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Evet'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    setState(() {
      _isLoading = true;
    });

    final result = await _repository.cancel();

    if (mounted) {
      setState(() {
        _isLoading = false;
      });

      if (result is NetworkSuccess) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Premium abonelik iptal edildi'),
            backgroundColor: AppColors.success,
          ),
        );
        _loadData();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result is NetworkError ? result.message : 'Bir hata oluştu'),
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
        title: Row(
          children: [
            Icon(
              Icons.star,
              color: AppColors.warning,
              size: 24,
            ),
            const SizedBox(width: 8),
            Text(
              'Premium Üyelik',
              style: AppTextStyles.heading(isDark: false),
            ),
          ],
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
      body: _isLoading && _isPremium == null
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
                    // Premium Durumu
                    if (_isPremium == true && _subscription != null)
                      _buildPremiumStatusCard(),

                    // Premium Özellikler
                    if (_features.isNotEmpty) _buildFeaturesSection(),

                    const SizedBox(height: 24),

                    // Premium Planlar
                    if (_plans.isNotEmpty) _buildPlansSection(),

                    const SizedBox(height: 24),

                    // Premium Olmayan Kullanıcılar İçin
                    if (_isPremium != true) _buildUpgradeSection(),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildPremiumStatusCard() {
    if (_subscription == null) return const SizedBox.shrink();

    return Container(
      margin: const EdgeInsets.only(bottom: 24),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppColors.warning,
            AppColors.warning.withOpacity(0.8),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: AppColors.warning.withOpacity(0.3),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.star, color: Colors.white, size: 32),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Premium Üyesiniz',
                      style: AppTextStyles.heading(isDark: false).copyWith(
                        color: Colors.white,
                        fontSize: 20,
                      ),
                    ),
                    if (_subscription!.expiresAt != null)
                      Text(
                        'Bitiş: ${DateFormat('dd MMM yyyy', 'tr_TR').format(_subscription!.expiresAt!)}',
                        style: AppTextStyles.body(isDark: false).copyWith(
                          color: Colors.white.withOpacity(0.9),
                          fontSize: 14,
                        ),
                      ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: _cancelSubscription,
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.white,
              foregroundColor: AppColors.warning,
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: const Text('Aboneliği İptal Et'),
          ),
        ],
      ),
    );
  }

  Widget _buildFeaturesSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Premium Özellikler',
          style: AppTextStyles.heading(isDark: false).copyWith(
            fontSize: 20,
          ),
        ),
        const SizedBox(height: 16),
        ..._features.map((feature) {
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
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppColors.primaryLight.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    Icons.check_circle,
                    color: AppColors.primaryLight,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        feature.featureName,
                        style: AppTextStyles.body(isDark: false).copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      if (feature.description != null) ...[
                        const SizedBox(height: 4),
                        Text(
                          feature.description!,
                          style: AppTextStyles.caption(isDark: false).copyWith(
                            color: AppColors.textSecondaryLight,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          );
        }).toList(),
      ],
    );
  }

  Widget _buildPlansSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Premium Planlar',
          style: AppTextStyles.heading(isDark: false).copyWith(
            fontSize: 20,
          ),
        ),
        const SizedBox(height: 16),
        ..._plans.map((plan) {
          final isYearly = plan.priceYearly != null;
          final price = isYearly ? plan.priceYearly : plan.priceMonthly;
          final monthlyPrice = isYearly ? (plan.priceYearly! / 12) : plan.priceMonthly;

          return Container(
            margin: const EdgeInsets.only(bottom: 16),
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: AppColors.cardBackground,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: AppColors.primaryLight.withOpacity(0.3),
                width: 2,
              ),
              boxShadow: [
                BoxShadow(
                  color: AppColors.shadowDark.withOpacity(0.1),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            plan.planName,
                            style: AppTextStyles.heading(isDark: false).copyWith(
                              fontSize: 22,
                            ),
                          ),
                          if (plan.description != null) ...[
                            const SizedBox(height: 4),
                            Text(
                              plan.description!,
                              style: AppTextStyles.caption(isDark: false).copyWith(
                                color: AppColors.textSecondaryLight,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                    if (isYearly)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.success.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          '2 Ay Bedava',
                          style: AppTextStyles.caption(isDark: false).copyWith(
                            color: AppColors.success,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 16),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      '₺${price!.toStringAsFixed(2)}',
                      style: AppTextStyles.heading(isDark: false).copyWith(
                        fontSize: 32,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Text(
                        isYearly ? '/yıl' : '/ay',
                        style: AppTextStyles.body(isDark: false).copyWith(
                          color: AppColors.textSecondaryLight,
                        ),
                      ),
                    ),
                    const Spacer(),
                    if (isYearly)
                      Text(
                        '₺${monthlyPrice!.toStringAsFixed(2)}/ay',
                        style: AppTextStyles.caption(isDark: false).copyWith(
                          color: AppColors.textSecondaryLight,
                          decoration: TextDecoration.lineThrough,
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _isPremium == true
                        ? null
                        : () => _subscribeToPlan(plan.planKey),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primaryLight,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: Text(
                      _isPremium == true ? 'Aktif' : 'Premium\'a Geç',
                      style: AppTextStyles.body(isDark: false).copyWith(
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
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

  Widget _buildUpgradeSection() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surfaceLight,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          Icon(
            Icons.star_outline,
            size: 48,
            color: AppColors.primaryLight,
          ),
          const SizedBox(height: 16),
          Text(
            'Premium\'a Geçin',
            style: AppTextStyles.heading(isDark: false).copyWith(
              fontSize: 20,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Tüm premium özelliklere erişin ve kampanyalardan daha fazla yararlanın',
            style: AppTextStyles.body(isDark: false).copyWith(
              color: AppColors.textSecondaryLight,
              textAlign: TextAlign.center,
            ),
          ),
        ],
      ),
    );
  }
}
