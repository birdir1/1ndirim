import 'package:flutter/material.dart';
import '../../core/widgets/empty_state.dart';
import '../../core/widgets/screen_shell.dart';
import '../../core/widgets/section_card.dart';

class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ScreenShell(
      title: 'Bildirimler',
      centerTitle: true,
      child: const Column(
        children: [
          SizedBox(height: 8),
          SectionCard(
            child: AppEmptyState(
              icon: Icons.notifications_outlined,
              title: 'Henüz bildirim yok',
              description:
                  'Yeni fırsatlar eklendiğinde sadece gerçekten işine yarayanları haber vereceğiz.',
            ),
          ),
        ],
      ),
    );
  }
}
