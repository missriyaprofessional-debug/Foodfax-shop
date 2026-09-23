import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../providers/shop_provider.dart';
import '../providers/order_provider.dart';
import '../theme/app_colors.dart';
import '../widgets/metric_card.dart';
import '../widgets/order_card.dart';
import '../widgets/rush_mode_banner.dart';
import '../widgets/shop_status_switch.dart';

class OwnerDashboardScreen extends StatefulWidget {
  const OwnerDashboardScreen({super.key});

  @override
  State<OwnerDashboardScreen> createState() => _OwnerDashboardScreenState();
}

class _OwnerDashboardScreenState extends State<OwnerDashboardScreen> {
  int _bottomNavIndex = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final shop = context.read<ShopProvider>().currentShop;
      if (shop != null) {
        context.read<OrderProvider>().initForShop(shop.id);
      }
    });
  }

  void _onBottomNavTapped(int index) {
    setState(() => _bottomNavIndex = index);
    switch (index) {
      case 0:
        break; // already on dashboard
      case 1:
        context.push('/orders');
        break;
      case 2:
        context.push('/menu');
        break;
      case 3:
        context.push('/shop-qr');
        break;
      case 4:
        context.push('/profile');
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    final shopProvider = context.watch<ShopProvider>();
    final orderProvider = context.watch<OrderProvider>();
    final shop = shopProvider.currentShop;

    if (shop == null) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      appBar: AppBar(
        automaticallyImplyLeading: false,
        title: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: AppColors.primary,
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.storefront, color: Colors.white, size: 20),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    shop.name,
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
                    overflow: TextOverflow.ellipsis,
                  ),
                  Text(
                    shop.shopType ?? 'Restaurant Partner',
                    style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          ShopStatusSwitch(
            isOpen: shop.isOpen,
            onChanged: (val) => shopProvider.toggleShopOpen(val),
          ),
          const SizedBox(width: 8),
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () => context.push('/notifications'),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          await orderProvider.initForShop(shop.id);
        },
        color: AppColors.primary,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Rush Mode Banner
              RushModeBanner(
                isRushMode: shop.isRushMode,
                extraMinutes: shop.rushExtraMinutes,
                onToggle: () {
                  shopProvider.toggleRushMode(!shop.isRushMode);
                },
              ),
              const SizedBox(height: 16),

              // Pending Orders Alert Bar (if any pending)
              if (orderProvider.pendingCount > 0) ...[
                InkWell(
                  onTap: () {
                    orderProvider.setStatusFilter('pending');
                    context.push('/orders');
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    decoration: BoxDecoration(
                      color: AppColors.statusPending.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.statusPending, width: 1.5),
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(6),
                          decoration: const BoxDecoration(
                            color: AppColors.statusPending,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.alarm, color: Colors.black, size: 18),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                '${orderProvider.pendingCount} NEW ORDER${orderProvider.pendingCount > 1 ? 'S' : ''} WAITING!',
                                style: const TextStyle(
                                  fontWeight: FontWeight.w800,
                                  color: AppColors.statusPending,
                                  fontSize: 13,
                                ),
                              ),
                              const Text(
                                'Tap to review and accept immediately',
                                style: TextStyle(fontSize: 11, color: AppColors.textPrimary),
                              ),
                            ],
                          ),
                        ),
                        const Icon(Icons.arrow_forward_ios, size: 14, color: AppColors.statusPending),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
              ],

              // Today's Performance Card
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFFEA580C), Color(0xFFF97316), Color(0xFFD97706)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.orange.withOpacity(0.25),
                      blurRadius: 16,
                      offset: const Offset(0, 6),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(6),
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.2),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Icon(Icons.insights, color: Colors.white, size: 16),
                            ),
                            const SizedBox(width: 8),
                            const Text(
                              "TODAY'S PERFORMANCE",
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 12,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 0.8,
                              ),
                            ),
                          ],
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Row(
                            children: [
                              Icon(Icons.bolt, color: Colors.yellowAccent, size: 12),
                              SizedBox(width: 4),
                              Text(
                                'Live Supabase',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    Row(
                      children: [
                        // Total Orders Today
                        Expanded(
                          child: Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: Colors.black.withOpacity(0.2),
                              borderRadius: BorderRadius.circular(14),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'Total Orders Today',
                                  style: TextStyle(
                                    color: Colors.white70,
                                    fontSize: 11,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Row(
                                  crossAxisAlignment: CrossAxisAlignment.baseline,
                                  textBaseline: TextBaseline.alphabetic,
                                  children: [
                                    Text(
                                      '${orderProvider.todayOrdersCount}',
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 24,
                                        fontWeight: FontWeight.w900,
                                      ),
                                    ),
                                    const SizedBox(width: 6),
                                    Text(
                                      '(${orderProvider.todayCompletedCount} settled)',
                                      style: const TextStyle(
                                        color: Colors.white70,
                                        fontSize: 10,
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        // Total Revenue Today
                        Expanded(
                          child: Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: Colors.black.withOpacity(0.2),
                              borderRadius: BorderRadius.circular(14),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  "Today's Revenue",
                                  style: TextStyle(
                                    color: Colors.white70,
                                    fontSize: 11,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Row(
                                  crossAxisAlignment: CrossAxisAlignment.baseline,
                                  textBaseline: TextBaseline.alphabetic,
                                  children: [
                                    Text(
                                      '₹${orderProvider.todayRevenue.toStringAsFixed(0)}',
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 24,
                                        fontWeight: FontWeight.w900,
                                      ),
                                    ),
                                    const SizedBox(width: 6),
                                    const Text(
                                      'settled',
                                      style: TextStyle(
                                        color: Colors.white70,
                                        fontSize: 10,
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Key Performance Indicators (Metrics)
              GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
                childAspectRatio: 1.45,
                children: [
                  MetricCard(
                    title: "Today's Sales",
                    value: '₹${orderProvider.todayRevenue.toStringAsFixed(0)}',
                    subtitle: 'From completed orders',
                    icon: Icons.currency_rupee,
                    iconColor: Colors.greenAccent,
                    onTap: () => context.push('/sales'),
                  ),
                  MetricCard(
                    title: 'Active Orders',
                    value: '${orderProvider.activeOrdersCount}',
                    subtitle: '${orderProvider.pendingCount} pending acceptance',
                    icon: Icons.receipt_long,
                    iconColor: AppColors.primary,
                    onTap: () => context.push('/orders'),
                  ),
                  MetricCard(
                    title: 'Preparing in Kitchen',
                    value: '${orderProvider.preparingCount}',
                    subtitle: '${orderProvider.readyCount} ready for pickup',
                    icon: Icons.soup_kitchen,
                    iconColor: AppColors.statusPreparing,
                    onTap: () {
                      orderProvider.setStatusFilter('preparing');
                      context.push('/orders');
                    },
                  ),
                  MetricCard(
                    title: 'Completed Today',
                    value: '${orderProvider.completedCount}',
                    subtitle: 'Full order history',
                    icon: Icons.check_circle,
                    iconColor: Colors.tealAccent,
                    onTap: () {
                      orderProvider.setStatusFilter('completed');
                      context.push('/orders');
                    },
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // Quick Actions Grid
              const Text(
                'Quick Owner Actions',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _buildQuickActionButton(
                      title: 'Live Orders',
                      icon: Icons.dinner_dining,
                      color: AppColors.primary,
                      onTap: () => context.push('/orders'),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _buildQuickActionButton(
                      title: 'Manage Menu',
                      icon: Icons.menu_book,
                      color: Colors.blueAccent,
                      onTap: () => context.push('/menu'),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _buildQuickActionButton(
                      title: 'Counter QR',
                      icon: Icons.qr_code,
                      color: Colors.purpleAccent,
                      onTap: () => context.push('/shop-qr'),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _buildQuickActionButton(
                      title: 'Analytics',
                      icon: Icons.insights,
                      color: Colors.emerald,
                      onTap: () => context.push('/sales'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),

              // Live Recent Orders Section
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Recent Orders',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
                  ),
                  TextButton(
                    onPressed: () => context.push('/orders'),
                    child: const Text('View All', style: TextStyle(color: AppColors.primary)),
                  ),
                ],
              ),
              const SizedBox(height: 8),

              if (orderProvider.orders.isEmpty)
                Container(
                  padding: const EdgeInsets.symmetric(vertical: 40),
                  alignment: Center(
                    child: Column(
                      children: [
                        Icon(Icons.inbox_outlined, size: 48, color: AppColors.textMuted),
                        const SizedBox(height: 12),
                        const Text(
                          'No orders yet today',
                          style: TextStyle(fontWeight: FontWeight.w600, color: AppColors.textSecondary),
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          'New customer orders will chime here in realtime',
                          style: TextStyle(fontSize: 12, color: AppColors.textMuted),
                        ),
                      ],
                    ),
                  ),
                )
              else
                ListView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: orderProvider.orders.take(5).length,
                  itemBuilder: (context, index) {
                    final order = orderProvider.orders[index];
                    return OrderCard(
                      order: order,
                      onTap: () => context.push('/orders/${order.id}'),
                      onAction: (nextStatus) {
                        orderProvider.updateStatus(order.id, nextStatus);
                      },
                    );
                  },
                ),
            ],
          ),
        ),
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _bottomNavIndex,
        onTap: _onBottomNavTapped,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.dashboard_rounded), label: 'Dashboard'),
          BottomNavigationBarItem(icon: Icon(Icons.receipt_long_rounded), label: 'Orders'),
          BottomNavigationBarItem(icon: Icon(Icons.restaurant_menu_rounded), label: 'Menu'),
          BottomNavigationBarItem(icon: Icon(Icons.qr_code_2_rounded), label: 'Shop QR'),
          BottomNavigationBarItem(icon: Icon(Icons.person_rounded), label: 'Profile'),
        ],
      ),
    );
  }

  Widget _buildQuickActionButton({
    required String title,
    required IconData icon,
    required Color color,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.cardBorder),
        ),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: color.withOpacity(0.15),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color, size: 20),
            ),
            const SizedBox(height: 8),
            Text(
              title,
              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}
