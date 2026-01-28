import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/page_transitions.dart';
import '../../../core/widgets/app_logo.dart';
import '../../profile/profile_screen.dart';
import '../calendar/calendar_screen.dart';
import 'search_bar_widget.dart';

/// Home Header Widget
class HomeHeader extends StatelessWidget {
  const HomeHeader({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 16, 24, 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: AppLogo(
                  fontSize: 26,
                  textColor: AppColors.textPrimaryLight,
                ),
              ),
              const SizedBox(width: 12),
              InkWell(
                onTap: () {
                  // Profil ekranına yönlendir
                  Navigator.of(context).push(
                    SlidePageRoute(
                      child: const ProfileScreen(),
                      direction: SlideDirection.right,
                    ),
                  );
                },
                borderRadius: BorderRadius.circular(20),
                child: Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: AppColors.overlayWhiteLight,
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: AppColors.textPrimaryLight.withOpacity(0.1),
                      width: 1,
                    ),
                  ),
                  child: Icon(
                    Icons.account_circle,
                    size: 24,
                    color: AppColors.primaryLight,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: const SearchBarWidget(),
              ),
              const SizedBox(width: 12),
              InkWell(
                onTap: () {
                  Navigator.of(context).push(
                    SlidePageRoute(
                      child: const CalendarScreen(),
                      direction: SlideDirection.up,
                    ),
                  );
                },
                borderRadius: BorderRadius.circular(12),
                child: Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: AppColors.overlayWhiteLight,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: AppColors.textPrimaryLight.withOpacity(0.1),
                      width: 1,
                    ),
                  ),
                  child: Icon(
                    Icons.calendar_today,
                    size: 20,
                    color: AppColors.primaryLight,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
