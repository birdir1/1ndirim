import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/empty_state.dart';

class DiscoverScreen extends StatelessWidget {
  const DiscoverScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      body: SafeArea(
        child: AppEmptyState(
          icon: Icons.explore_outlined,
          title: 'Yakında',
          description:
              'Tüm kampanyaları tek tek aramana gerek kalmayacak. Bu özellik yakında eklenecek.',
        ),
      ),
    );
  }
}
