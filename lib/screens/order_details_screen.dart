import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../providers/order_provider.dart';
import '../theme/app_colors.dart';
import '../widgets/status_badge.dart';
import '../widgets/custom_button.dart';

class OrderDetailsScreen extends StatelessWidget {
  final String orderId;

  const OrderDetailsScreen({super.key, required this.orderId});

  @override
  Widget build(BuildContext context) {
    final orderProvider = context.watch<OrderProvider>();
    final order = orderProvider.orders.firstWhere(
      (o) => o.id == orderId,
      orElse: () => throw Exception('Order not found'),
    );

    final currency = NumberFormat.currency(symbol: '₹', decimalDigits: 0);
    final timeStr = DateFormat('dd MMM yyyy, hh:mm a').format(order.createdAt);

    return Scaffold(
      appBar: AppBar(
        title: Text(order.orderNumber),
        actions: [
          IconButton(
            icon: const Icon(Icons.print_outlined),
            tooltip: 'Print Kitchen KOT',
            onPressed: () => _showKotPreview(context, order),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Status and Header Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.cardBorder),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            order.orderNumber,
                            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            timeStr,
                            style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
                          ),
                        ],
                      ),
                      StatusBadge(status: order.status),
                    ],
                  ),
                  const Divider(height: 24, color: AppColors.cardBorder),

                  // Order Type & Table
                  Row(
                    children: [
                      _buildInfoTag(
                        icon: Icons.delivery_dining,
                        label: 'TYPE',
                        value: order.orderType.toUpperCase(),
                      ),
                      const SizedBox(width: 12),
                      if (order.tableNumber != null)
                        _buildInfoTag(
                          icon: Icons.table_restaurant,
                          label: 'TABLE',
                          value: 'Table #${order.tableNumber}',
                        ),
                      const SizedBox(width: 12),
                      _buildInfoTag(
                        icon: Icons.payment,
                        label: 'PAYMENT',
                        value: '${order.paymentMethod.toUpperCase()} (${order.paymentStatus.toUpperCase()})',
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Order Status Timeline
            _buildStatusTimeline(order.status),
            const SizedBox(height: 16),

            // Customer Details Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.cardBorder),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Customer Information',
                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: AppColors.primary.withOpacity(0.15),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.person, color: AppColors.primary, size: 20),
                          ),
                          const SizedBox(width: 12),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(order.customerName, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
                              Text(order.customerPhone, style: const TextStyle(fontSize: 13, color: AppColors.textSecondary)),
                            ],
                          ),
                        ],
                      ),
                      Row(
                        children: [
                          IconButton(
                            icon: const Icon(Icons.phone, color: Colors.greenAccent),
                            onPressed: () {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(content: Text('Calling customer: ${order.customerPhone}')),
                              );
                            },
                          ),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Ordered Items List
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.cardBorder),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Order Items',
                        style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
                      ),
                      Text(
                        '${order.items.length} Items',
                        style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
                      ),
                    ],
                  ),
                  const Divider(height: 20, color: AppColors.cardBorder),
                  ...order.items.map((item) {
                    return Padding(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            margin: const EdgeInsets.only(top: 4),
                            width: 10,
                            height: 10,
                            decoration: BoxDecoration(
                              color: item.isVeg ? AppColors.vegGreen : AppColors.nonVegRed,
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  item.name,
                                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
                                ),
                                if (item.notes != null && item.notes!.isNotEmpty)
                                  Padding(
                                    padding: const EdgeInsets.only(top: 2),
                                    child: Text(
                                      'Note: "${item.notes}"',
                                      style: const TextStyle(fontSize: 12, color: Colors.amberAccent, fontStyle: FontStyle.italic),
                                    ),
                                  ),
                                Text(
                                  '${currency.format(item.price)} × ${item.quantity}',
                                  style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                                ),
                              ],
                            ),
                          ),
                          Text(
                            currency.format(item.price * item.quantity),
                            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
                          ),
                        ],
                      ),
                    );
                  }),
                  const Divider(height: 24, color: AppColors.cardBorder),

                  // Bill Breakdown
                  _buildBillRow('Subtotal', currency.format(order.subtotal)),
                  if (order.tax > 0) _buildBillRow('Taxes & GST (5%)', currency.format(order.tax)),
                  if (order.discount > 0) _buildBillRow('Coupon Discount', '-${currency.format(order.discount)}', isDiscount: true),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Total Payable',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
                      ),
                      Text(
                        currency.format(order.totalAmount),
                        style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: AppColors.primary),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Action Buttons based on status
            _buildOrderActions(context, orderProvider, order),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoTag({required IconData icon, required String label, required String value}) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: AppColors.background,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, size: 12, color: AppColors.textMuted),
                const SizedBox(width: 4),
                Text(label, style: const TextStyle(fontSize: 10, color: AppColors.textMuted, fontWeight: FontWeight.w600)),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              value,
              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBillRow(String label, String amount, {bool isDiscount = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 13, color: AppColors.textSecondary)),
          Text(
            amount,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: isDiscount ? Colors.greenAccent : AppColors.textPrimary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusTimeline(String currentStatus) {
    final stages = ['pending', 'accepted', 'preparing', 'ready', 'completed'];
    final currentIndex = stages.indexOf(currentStatus.toLowerCase());

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.cardBorder),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: List.generate(stages.length, (index) {
          final isPastOrCurrent = currentIndex >= index && currentIndex != -1;
          final isCurrent = currentIndex == index;

          return Expanded(
            child: Column(
              children: [
                Container(
                  width: 28,
                  height: 28,
                  decoration: BoxDecoration(
                    color: isPastOrCurrent ? AppColors.primary : AppColors.background,
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: isCurrent ? Colors.white : AppColors.cardBorder,
                      width: isCurrent ? 2 : 1,
                    ),
                  ),
                  child: Icon(
                    isPastOrCurrent ? Icons.check : Icons.circle,
                    size: 14,
                    color: isPastOrCurrent ? Colors.white : AppColors.textMuted,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  stages[index].toUpperCase(),
                  style: TextStyle(
                    fontSize: 9,
                    fontWeight: isCurrent ? FontWeight.w800 : FontWeight.w600,
                    color: isCurrent ? AppColors.primary : AppColors.textMuted,
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          );
        }),
      ),
    );
  }

  Widget _buildOrderActions(BuildContext context, OrderProvider provider, dynamic order) {
    switch (order.status.toLowerCase()) {
      case 'pending':
        return Row(
          children: [
            Expanded(
              child: CustomButton(
                text: 'Reject Order',
                isOutlined: true,
                backgroundColor: Colors.redAccent,
                textColor: Colors.redAccent,
                onPressed: () {
                  provider.updateStatus(order.id, 'cancelled', cancellationReason: 'Store unavailable');
                  Navigator.pop(context);
                },
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: CustomButton(
                text: 'Accept Order',
                onPressed: () {
                  provider.updateStatus(order.id, 'accepted');
                },
              ),
            ),
          ],
        );
      case 'accepted':
        return CustomButton(
          text: 'Send to Kitchen (Start Preparing)',
          icon: Icons.soup_kitchen,
          backgroundColor: AppColors.statusPreparing,
          onPressed: () {
            provider.updateStatus(order.id, 'preparing');
          },
        );
      case 'preparing':
        return CustomButton(
          text: 'Mark Ready for Pickup / Delivery',
          icon: Icons.check_circle_outline,
          backgroundColor: AppColors.statusReady,
          onPressed: () {
            provider.updateStatus(order.id, 'ready');
          },
        );
      case 'ready':
        return CustomButton(
          text: 'Mark as Completed',
          icon: Icons.done_all,
          backgroundColor: AppColors.statusCompleted,
          onPressed: () {
            provider.updateStatus(order.id, 'completed');
            Navigator.pop(context);
          },
        );
      default:
        return const SizedBox.shrink();
    }
  }

  void _showKotPreview(BuildContext context, dynamic order) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) {
        return Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              const Text(
                '--- KITCHEN ORDER TICKET (KOT) ---',
                style: TextStyle(color: Colors.black, fontWeight: FontWeight.w900, fontFamily: 'monospace', fontSize: 15),
              ),
              const SizedBox(height: 8),
              Text(
                'ORDER: ${order.orderNumber} | TYPE: ${order.orderType.toUpperCase()}',
                style: const TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontFamily: 'monospace'),
              ),
              const Divider(color: Colors.black, thickness: 1),
              ...order.items.map((i) => Padding(
                    padding: const EdgeInsets.symmetric(vertical: 4),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          '${i.quantity}x ${i.name}',
                          style: const TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontFamily: 'monospace'),
                        ),
                        if (i.notes != null)
                          Text('(${i.notes})', style: const TextStyle(color: Colors.red, fontFamily: 'monospace', fontSize: 11)),
                      ],
                    ),
                  )),
              const Divider(color: Colors.black, thickness: 1),
              const SizedBox(height: 12),
              ElevatedButton.icon(
                onPressed: () {
                  Navigator.pop(ctx);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('KOT sent to thermal kitchen printer!')),
                  );
                },
                icon: const Icon(Icons.print),
                label: const Text('Send to Thermal Printer'),
                style: ElevatedButton.styleFrom(backgroundColor: Colors.black, foregroundColor: Colors.white),
              ),
            ],
          ),
        );
      },
    );
  }
}
