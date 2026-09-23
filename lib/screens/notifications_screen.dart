import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/order_provider.dart';
import '../services/audio_service.dart';
import '../theme/app_colors.dart';

class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final orderProvider = context.watch<OrderProvider>();
    final audio = AudioService();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Store Notifications'),
        actions: [
          IconButton(
            icon: const Icon(Icons.volume_up),
            tooltip: 'Test Sound',
            onPressed: () => audio.playNewOrderAlert(),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppColors.primary.withOpacity(0.15),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.primary.withOpacity(0.3)),
            ),
            child: Row(
              children: [
                const Icon(Icons.surround_sound, color: AppColors.primary),
                const SizedBox(width: 12),
                const Expanded(
                  child: Text(
                    'Order Chimes are active. Keep device volume up for incoming kitchen alerts.',
                    style: TextStyle(fontSize: 12, color: AppColors.textPrimary),
                  ),
                ),
                TextButton(
                  onPressed: () => audio.playNewOrderAlert(),
                  child: const Text('Test', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          const Text('Recent Alerts', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
          const SizedBox(height: 12),

          if (orderProvider.orders.isEmpty)
            const Center(
              child: Padding(
                padding: EdgeInsets.all(32),
                child: Text('No alerts yet', style: TextStyle(color: AppColors.textMuted)),
              ),
            )
          else
            ...orderProvider.orders.take(10).map((order) {
              return Container(
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.cardBorder),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withOpacity(0.15),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.receipt, color: AppColors.primary, size: 18),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Order ${order.orderNumber} - ${order.customerName}',
                              style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                          Text('Status: ${order.status.toUpperCase()} • ₹${order.totalAmount.toStringAsFixed(0)}',
                              style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                        ],
                      ),
                    ),
                  ],
                ),
              );
            }),
        ],
      ),
    );
  }
}
