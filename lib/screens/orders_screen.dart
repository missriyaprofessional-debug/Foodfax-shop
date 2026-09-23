import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../providers/shop_provider.dart';
import '../providers/order_provider.dart';
import '../models/order.dart';
import '../theme/app_colors.dart';
import '../widgets/order_card.dart';

class OrdersScreen extends StatefulWidget {
  const OrdersScreen({super.key});

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final TextEditingController _searchController = TextEditingController();
  String _searchFilter = '';

  // Mode: 0 for 'Active Orders', 1 for 'Order History'
  int _selectedView = 0;

  final List<String> _activeTabs = [
    'All Active',
    'Pending',
    'Accepted',
    'Preparing',
    'Ready',
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _activeTabs.length, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final shop = context.read<ShopProvider>().currentShop;
      if (shop != null) {
        context.read<OrderProvider>().loadOrders(shop.id);
      }
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final orderProvider = context.watch<OrderProvider>();
    final shopProvider = context.watch<ShopProvider>();
    final shop = shopProvider.currentShop;

    // Active orders: pending, accepted, preparing, ready
    final activeOrders = orderProvider.orders.where((o) =>
        ['pending', 'accepted', 'preparing', 'ready'].contains(o.status.toLowerCase())).toList();

    // Completed orders from Supabase table
    final completedOrders = orderProvider.orders.where((o) =>
        o.status.toLowerCase() == 'completed').toList();

    List<OwnerOrder> currentList;
    if (_selectedView == 0) {
      // Active orders tab filtered
      final currentTab = _activeTabs[_tabController.index].toLowerCase();
      if (currentTab == 'all active') {
        currentList = activeOrders;
      } else {
        currentList = activeOrders.where((o) => o.status.toLowerCase() == currentTab).toList();
      }
    } else {
      // Order History view
      currentList = completedOrders;
    }

    final filteredOrders = currentList.where((order) {
      if (_searchFilter.isEmpty) return true;
      final q = _searchFilter.toLowerCase();
      return order.orderNumber.toLowerCase().contains(q) ||
          order.customerName.toLowerCase().contains(q) ||
          order.customerPhone.contains(q);
    }).toList();

    final totalHistoryRevenue = completedOrders.fold(0.0, (sum, o) => sum + o.totalAmount);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Orders Management'),
        bottom: PreferredSize(
          preferredSize: Size.fromHeight(_selectedView == 0 ? 116 : 64),
          child: Column(
            children: [
              // Segmented view toggle: 'Active Orders' vs 'Order History'
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                child: Container(
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: InkWell(
                          onTap: () {
                            setState(() {
                              _selectedView = 0;
                            });
                          },
                          borderRadius: BorderRadius.circular(11),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 8),
                            decoration: BoxDecoration(
                              color: _selectedView == 0 ? AppColors.primary : Colors.transparent,
                              borderRadius: BorderRadius.circular(11),
                            ),
                            alignment: Alignment.center,
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  Icons.electric_bolt,
                                  size: 16,
                                  color: _selectedView == 0 ? Colors.white : AppColors.textSecondary,
                                ),
                                const SizedBox(width: 6),
                                Text(
                                  'Active Orders',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w800,
                                    color: _selectedView == 0 ? Colors.white : AppColors.textSecondary,
                                  ),
                                ),
                                if (activeOrders.isNotEmpty) ...[
                                  const SizedBox(width: 6),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                                    decoration: BoxDecoration(
                                      color: _selectedView == 0 ? Colors.white24 : AppColors.primary,
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    child: Text(
                                      '${activeOrders.length}',
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 10,
                                        fontWeight: FontWeight.w800,
                                      ),
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ),
                        ),
                      ),
                      Expanded(
                        child: InkWell(
                          onTap: () {
                            setState(() {
                              _selectedView = 1;
                            });
                          },
                          borderRadius: BorderRadius.circular(11),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 8),
                            decoration: BoxDecoration(
                              color: _selectedView == 1 ? AppColors.primary : Colors.transparent,
                              borderRadius: BorderRadius.circular(11),
                            ),
                            alignment: Alignment.center,
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  Icons.history,
                                  size: 16,
                                  color: _selectedView == 1 ? Colors.white : AppColors.textSecondary,
                                ),
                                const SizedBox(width: 6),
                                Text(
                                  'Order History',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w800,
                                    color: _selectedView == 1 ? Colors.white : AppColors.textSecondary,
                                  ),
                                ),
                                if (completedOrders.isNotEmpty) ...[
                                  const SizedBox(width: 6),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                                    decoration: BoxDecoration(
                                      color: _selectedView == 1 ? Colors.white24 : AppColors.surfaceLight,
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    child: Text(
                                      '${completedOrders.length}',
                                      style: TextStyle(
                                        color: _selectedView == 1 ? Colors.white : AppColors.textPrimary,
                                        fontSize: 10,
                                        fontWeight: FontWeight.w800,
                                      ),
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // Search input
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                child: TextField(
                  controller: _searchController,
                  onChanged: (val) => setState(() => _searchFilter = val),
                  style: const TextStyle(fontSize: 13),
                  decoration: InputDecoration(
                    hintText: _selectedView == 0
                        ? 'Search active orders by # or customer...'
                        : 'Search completed orders in history...',
                    prefixIcon: const Icon(Icons.search, size: 18),
                    suffixIcon: _searchFilter.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear, size: 16),
                            onPressed: () {
                              _searchController.clear();
                              setState(() => _searchFilter = '');
                            },
                          )
                        : null,
                    contentPadding: const EdgeInsets.symmetric(vertical: 0, horizontal: 16),
                  ),
                ),
              ),

              // Active status sub-tabs (only shown when in Active Orders mode)
              if (_selectedView == 0)
                TabBar(
                  controller: _tabController,
                  isScrollable: true,
                  indicatorColor: AppColors.primary,
                  labelColor: AppColors.primary,
                  unselectedLabelColor: AppColors.textSecondary,
                  labelStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12),
                  onTap: (_) => setState(() {}),
                  tabs: _activeTabs.map((tab) {
                    int badgeCount = 0;
                    if (tab == 'Pending') badgeCount = orderProvider.pendingCount;
                    if (tab == 'Preparing') badgeCount = orderProvider.preparingCount;
                    if (tab == 'Ready') badgeCount = orderProvider.readyCount;

                    return Tab(
                      child: Row(
                        children: [
                          Text(tab),
                          if (badgeCount > 0) ...[
                            const SizedBox(width: 5),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                              decoration: BoxDecoration(
                                color: tab == 'Pending' ? AppColors.statusPending : AppColors.primary,
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Text(
                                '$badgeCount',
                                style: const TextStyle(color: Colors.black, fontSize: 9, fontWeight: FontWeight.w800),
                              ),
                            ),
                          ],
                        ],
                      ),
                    );
                  }).toList(),
                ),
            ],
          ),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          if (shop != null) {
            await orderProvider.initForShop(shop.id);
          }
        },
        color: AppColors.primary,
        child: Column(
          children: [
            // Order History Summary banner
            if (_selectedView == 1)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                color: AppColors.surface,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.check_circle_outline, color: Colors.tealAccent, size: 16),
                        const SizedBox(width: 8),
                        Text(
                          '${completedOrders.length} Completed Orders from Database',
                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
                        ),
                      ],
                    ),
                    Text(
                      '₹${totalHistoryRevenue.toStringAsFixed(0)}',
                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: Colors.greenAccent),
                    ),
                  ],
                ),
              ),

            Expanded(
              child: filteredOrders.isEmpty
                  ? ListView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      children: [
                        SizedBox(
                          height: MediaQuery.of(context).size.height * 0.45,
                          child: Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  _selectedView == 0 ? Icons.inbox_rounded : Icons.history_toggle_off,
                                  size: 54,
                                  color: AppColors.textMuted,
                                ),
                                const SizedBox(height: 12),
                                Text(
                                  _selectedView == 0
                                      ? 'No ${_activeTabs[_tabController.index]} orders found'
                                      : 'No completed order history found',
                                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.textSecondary),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  _selectedView == 0
                                      ? 'New incoming orders will appear automatically'
                                      : 'Settled orders from Supabase orders table appear here',
                                  style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: filteredOrders.length,
                      itemBuilder: (context, index) {
                        final order = filteredOrders[index];
                        return OrderCard(
                          order: order,
                          onTap: () => context.push('/orders/${order.id}'),
                          onAction: (nextStatus) {
                            orderProvider.updateStatus(order.id, nextStatus);
                          },
                          onCancel: () => _showCancelDialog(context, order.id),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }

  void _showCancelDialog(BuildContext context, String orderId) {
    String selectedReason = 'Item out of stock';
    final reasons = [
      'Item out of stock',
      'Kitchen overloaded / rush',
      'Shop closing early',
      'Customer requested cancellation',
      'Cannot fulfill special instructions',
    ];

    showDialog(
      context: context,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setDialogState) {
            return AlertDialog(
              backgroundColor: AppColors.surface,
              title: const Text('Reject / Cancel Order', style: TextStyle(fontWeight: FontWeight.w800)),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Please select the reason for cancelling this order:'),
                  const SizedBox(height: 12),
                  ...reasons.map((r) {
                    return RadioListTile<String>(
                      title: Text(r, style: const TextStyle(fontSize: 13)),
                      value: r,
                      groupValue: selectedReason,
                      activeColor: AppColors.primary,
                      contentPadding: EdgeInsets.zero,
                      onChanged: (val) {
                        if (val != null) setDialogState(() => selectedReason = val);
                      },
                    );
                  }),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(ctx),
                  child: const Text('Keep Order'),
                ),
                ElevatedButton(
                  onPressed: () {
                    context.read<OrderProvider>().updateStatus(
                          orderId,
                          'cancelled',
                          cancellationReason: selectedReason,
                        );
                    Navigator.pop(ctx);
                  },
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.red.shade700),
                  child: const Text('Confirm Reject'),
                ),
              ],
            );
          },
        );
      },
    );
  }
}
