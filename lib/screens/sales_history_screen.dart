import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../providers/order_provider.dart';
import '../theme/app_colors.dart';
import '../widgets/metric_card.dart';

class SalesHistoryScreen extends StatefulWidget {
  const SalesHistoryScreen({super.key});

  @override
  State<SalesHistoryScreen> createState() => _SalesHistoryScreenState();
}

class _SalesHistoryScreenState extends State<SalesHistoryScreen> {
  int _selectedFilterDays = 1; // 1 = today, 7 = 7 days, 30 = month

  @override
  Widget build(BuildContext context) {
    final orderProvider = context.watch<OrderProvider>();
    final currency = NumberFormat.currency(symbol: '₹', decimalDigits: 0);

    final completedOrders = orderProvider.orders
        .where((o) => o.status == 'completed')
        .toList();

    final totalRevenue = completedOrders.fold(0.0, (sum, o) => sum + o.totalAmount);
    final upiCount = completedOrders.where((o) => o.paymentMethod == 'upi').length;
    final cashCount = completedOrders.where((o) => o.paymentMethod == 'cash').length;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Sales & Revenue Analytics'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Filter Pills
            Row(
              children: [
                _buildFilterChip('Today', 1),
                const SizedBox(width: 8),
                _buildFilterChip('Last 7 Days', 7),
                const SizedBox(width: 8),
                _buildFilterChip('Last 30 Days', 30),
              ],
            ),
            const SizedBox(height: 16),

            // Revenue Metric Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFFE64A19), Color(0xFFFF5722)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primary.withOpacity(0.3),
                    blurRadius: 16,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Total Net Revenue', style: TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 8),
                  Text(
                    currency.format(totalRevenue),
                    style: const TextStyle(fontSize: 32, fontWeight: FontWeight.w900, color: Colors.white),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('${completedOrders.length} Paid Orders', style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
                      const Text('100% Payout to UPI', style: TextStyle(color: Colors.white70, fontSize: 11)),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Breakdown Grid
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 1.5,
              children: [
                MetricCard(
                  title: 'UPI Payments',
                  value: '$upiCount',
                  subtitle: 'Direct bank transfer',
                  icon: Icons.account_balance,
                  iconColor: Colors.blueAccent,
                ),
                MetricCard(
                  title: 'Cash at Counter',
                  value: '$cashCount',
                  subtitle: 'Direct counter settlement',
                  icon: Icons.payments,
                  iconColor: Colors.amber,
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Order History Log
            const Text(
              'Settled Orders Log',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
            ),
            const SizedBox(height: 12),

            if (completedOrders.isEmpty)
              Container(
                padding: const EdgeInsets.all(32),
                alignment: Alignment.center,
                child: const Text('No completed orders in this period yet', style: TextStyle(color: AppColors.textMuted)),
              )
            else
              ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: completedOrders.length,
                itemBuilder: (context, index) {
                  final order = completedOrders[index];
                  final timeStr = DateFormat('hh:mm a, dd MMM').format(order.createdAt);

                  return Container(
                    padding: const EdgeInsets.all(14),
                    margin: const EdgeInsets.only(bottom: 10),
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.cardBorder),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(order.orderNumber, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
                            const SizedBox(height: 2),
                            Text('${order.customerName} • $timeStr', style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                          ],
                        ),
                        Text(
                          currency.format(order.totalAmount),
                          style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: Colors.greenAccent),
                        ),
                      ],
                    ),
                  );
                },
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterChip(String label, int days) {
    final isSelected = _selectedFilterDays == days;
    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      selectedColor: AppColors.primary,
      onSelected: (_) => setState(() => _selectedFilterDays = days),
      labelStyle: TextStyle(
        color: isSelected ? Colors.white : AppColors.textSecondary,
        fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
        fontSize: 12,
      ),
    );
  }
}
