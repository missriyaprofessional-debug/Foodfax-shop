import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class StatusBadge extends StatelessWidget {
  final String status;

  const StatusBadge({super.key, required this.status});

  @override
  Widget build(BuildContext context) {
    Color bg;
    Color fg;
    String label;

    switch (status.toLowerCase()) {
      case 'pending':
        bg = AppColors.statusPending.withOpacity(0.15);
        fg = AppColors.statusPending;
        label = 'Pending';
        break;
      case 'accepted':
        bg = AppColors.statusAccepted.withOpacity(0.15);
        fg = AppColors.statusAccepted;
        label = 'Accepted';
        break;
      case 'preparing':
        bg = AppColors.statusPreparing.withOpacity(0.15);
        fg = AppColors.statusPreparing;
        label = 'Preparing';
        break;
      case 'ready':
        bg = AppColors.statusReady.withOpacity(0.15);
        fg = AppColors.statusReady;
        label = 'Ready for Pickup';
        break;
      case 'completed':
        bg = AppColors.statusCompleted.withOpacity(0.15);
        fg = AppColors.statusCompleted;
        label = 'Completed';
        break;
      case 'cancelled':
        bg = AppColors.statusCancelled.withOpacity(0.15);
        fg = AppColors.statusCancelled;
        label = 'Cancelled';
        break;
      default:
        bg = Colors.grey.withOpacity(0.2);
        fg = Colors.grey;
        label = status.toUpperCase();
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: fg.withOpacity(0.3), width: 1),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 6,
            height: 6,
            decoration: BoxDecoration(color: fg, shape: BoxShape.circle),
          ),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(color: fg, fontSize: 12, fontWeight: FontWeight.w700),
          ),
        ],
      ),
    );
  }
}
