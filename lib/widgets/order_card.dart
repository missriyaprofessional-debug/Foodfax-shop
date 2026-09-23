import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/order.dart';
import '../theme/app_colors.dart';
import 'status_badge.dart';

class OrderCard extends StatelessWidget {
  final OwnerOrder order;
  final VoidCallback onTap;
  final Function(String nextStatus)? onAction;
  final VoidCallback? onCancel;

  const OrderCard({
    super.key,
    required this.order,
    required this.onTap,
    this.onAction,
    this.onCancel,
  });

  @override
  Widget build(BuildContext context) {
    final timeStr = DateFormat('hh:mm a').format(order.createdAt);
    final currency = NumberFormat.currency(symbol: '₹', decimalDigits: 0);

    return Card(
      margin: const EdgeInsets.only(bottom: 14),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header: Order #, Order Type, Status
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Text(
                        order.orderNumber,
                        style: const TextStyle(
                          fontWeight: FontWeight.w800,
                          fontSize: 16,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppColors.surface,
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: AppColors.cardBorder),
                        ),
                        child: Text(
                          order.orderType.toUpperCase(),
                          style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: AppColors.textSecondary),
                        ),
                      ),
                    ],
                  ),
                  StatusBadge(status: order.status),
                ],
              ),
              const SizedBox(height: 10),

              // Customer & Time
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.person_outline, size: 16, color: AppColors.textSecondary),
                      const SizedBox(width: 6),
                      Text(
                        order.customerName,
                        style: const TextStyle(fontWeight: FontWeight.w600, color: AppColors.textPrimary, fontSize: 14),
                      ),
                    ],
                  ),
                  Text(
                    timeStr,
                    style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
                  ),
                ],
              ),
              const Divider(height: 20, color: AppColors.cardBorder),

              // Items summary
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: order.items.take(3).map((item) {
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 4),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Container(
                              width: 8,
                              height: 8,
                              decoration: BoxDecoration(
                                color: item.isVeg ? AppColors.vegGreen : AppColors.nonVegRed,
                                shape: BoxShape.circle,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              '${item.quantity}x ${item.name}',
                              style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                            ),
                          ],
                        ),
                        Text(
                          currency.format(item.price * item.quantity),
                          style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                        ),
                      ],
                    ),
                  );
                }).toList(),
              ),

              if (order.items.length > 3)
                Padding(
                  padding: const EdgeInsets.only(top: 4),
                  child: Text(
                    '+ ${order.items.length - 3} more items...',
                    style: const TextStyle(fontSize: 11, color: AppColors.textMuted, fontStyle: FontStyle.italic),
                  ),
                ),

              const SizedBox(height: 12),

              // Total & Action Button
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Total Amount',
                        style: TextStyle(fontSize: 11, color: AppColors.textMuted),
                      ),
                      Text(
                        currency.format(order.totalAmount),
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          color: AppColors.primary,
                        ),
                      ),
                    ],
                  ),
                  _buildActionButtons(),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildActionButtons() {
    switch (order.status.toLowerCase()) {
      case 'pending':
        return Row(
          children: [
            if (onCancel != null)
              OutlinedButton(
                onPressed: onCancel,
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.redAccent,
                  side: const BorderSide(color: Colors.redAccent),
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  minimumSize: Size.zero,
                ),
                child: const Text('Reject', style: TextStyle(fontSize: 12)),
              ),
            const SizedBox(width: 8),
            ElevatedButton(
              onPressed: () => onAction?.call('accepted'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                minimumSize: Size.zero,
              ),
              child: const Text('Accept', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
            ),
          ],
        );
      case 'accepted':
        return ElevatedButton(
          onPressed: () => onAction?.call('preparing'),
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.statusPreparing,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            minimumSize: Size.zero,
          ),
          child: const Text('Start Preparing', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
        );
      case 'preparing':
        return ElevatedButton(
          onPressed: () => onAction?.call('ready'),
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.statusReady,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            minimumSize: Size.zero,
          ),
          child: const Text('Mark Ready', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
        );
      case 'ready':
        return ElevatedButton(
          onPressed: () => onAction?.call('completed'),
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.statusCompleted,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            minimumSize: Size.zero,
          ),
          child: const Text('Complete', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
        );
      default:
        return const SizedBox.shrink();
    }
  }
}
