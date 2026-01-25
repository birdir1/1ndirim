import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../widgets/primary_button.dart';

/// Onboarding 1 - Value Proposition
/// "Zaten senin olan fırsatlar."
class ValuePropPage extends StatelessWidget {
  final VoidCallback onNext;
  final bool isDark;

  const ValuePropPage({
    super.key,
    required this.onNext,
    this.isDark = false,
  });

  @override
  Widget build(BuildContext context) {
    final screenHeight = MediaQuery.of(context).size.height;
    final isSmallScreen = screenHeight < 700; // iPhone SE gibi küçük ekranlar
    
    return SafeArea(
      child: Container(
        padding: EdgeInsets.symmetric(
          horizontal: 24,
          vertical: isSmallScreen ? 4 : 8,
        ),
        color: AppColors.backgroundLight,
        child: LayoutBuilder(
          builder: (context, constraints) {
            return Column(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Top section: Icons and Text
                Flexible(
                  child: SingleChildScrollView(
                    physics: const NeverScrollableScrollPhysics(),
                    child: ConstrainedBox(
                      constraints: BoxConstraints(
                        minHeight: constraints.maxHeight - 100, // Button için alan bırak
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          // Icon Grid (2x2)
                          _buildIconGrid(isSmallScreen),
                          
                          SizedBox(height: isSmallScreen ? 8 : 12), // Azaltıldı: 10-14 → 8-12
                          
                          // Text Content
                          _buildContent(isSmallScreen),
                        ],
                      ),
                    ),
                  ),
                ),
                
                // Bottom section: Button
                PrimaryButton(
                  label: 'Devam →',
                  onPressed: onNext,
                  isDark: isDark,
                ),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _buildIconGrid(bool isSmallScreen) {
    final iconSize = isSmallScreen ? 24.0 : 28.0;
    final spacing = isSmallScreen ? 8.0 : 10.0;
    final gridSize = isSmallScreen ? 115.0 : 125.0; // Biraz küçültüldü: 120-130 → 115-125
    
    return SizedBox(
      width: gridSize * 2 + spacing,
      height: gridSize * 2 + spacing,
      child: GridView.count(
        crossAxisCount: 2,
        mainAxisSpacing: spacing,
        crossAxisSpacing: spacing,
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        childAspectRatio: 1.0,
        children: [
          _buildIconBox(Icons.credit_card, iconSize),
          _buildIconBox(Icons.signal_cellular_alt, iconSize),
          _buildIconBox(Icons.shopping_bag, iconSize),
          _buildIconBox(Icons.auto_awesome, iconSize),
        ],
      ),
    );
  }

  Widget _buildIconBox(IconData icon, double iconSize) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surfaceLight, // #FFF8DE
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: AppColors.primaryLight.withOpacity(0.2),
          width: 1.5,
        ),
        boxShadow: [
          BoxShadow(
            color: AppColors.primaryLight.withOpacity(0.15),
            blurRadius: 8,
            offset: const Offset(0, 4),
            spreadRadius: 0,
          ),
        ],
      ),
      child: Icon(
        icon,
        color: AppColors.primaryLight, // #8CA9FF
        size: iconSize,
      ),
    );
  }

  Widget _buildContent(bool isSmallScreen) {
    final titleFontSize = isSmallScreen ? 20.0 : 22.0;
    final descriptionFontSize = isSmallScreen ? 15.0 : 16.0; // Büyütüldü: 13-14 → 15-16
    final titleSpacing = isSmallScreen ? 8.0 : 10.0; // Azaltıldı: 10-12 → 8-10
    
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Başlık
        Text(
          'Zaten senin olan fırsatlar.',
          style: AppTextStyles.headline(isDark: isDark).copyWith(
            fontSize: titleFontSize,
            fontWeight: FontWeight.w800,
            letterSpacing: -0.3,
            height: 1.2,
          ),
          textAlign: TextAlign.center,
        ),
        SizedBox(height: titleSpacing),
        
        // Açıklama metni
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8),
          child: Text(
            'Banka ve operatörlerin sana özel kampanyalarını\ntek ekranda gör.\n\nBiz sadece gösteririz.\nKullanım tamamen sende.',
            style: AppTextStyles.bodySecondary(isDark: isDark).copyWith(
              fontSize: descriptionFontSize,
              height: 1.35, // Biraz artırıldı: 1.3 → 1.35
              color: AppColors.textSecondaryLight,
              fontWeight: FontWeight.w500, // Okunabilirlik için hafif bold
            ),
            textAlign: TextAlign.center,
          ),
        ),
      ],
    );
  }
}
