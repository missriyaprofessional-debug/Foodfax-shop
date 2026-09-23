import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../providers/shop_provider.dart';
import '../providers/order_provider.dart';
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

  final List<String> _tabs = [
    'All',
    'Pending',
    'Accepted',
    'Preparing',
    'Ready',
    'Completed',
    'Cancelled',
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _tabs.length, vsync: this);
    _tabController.addListener(() {
      if (!_tabController.indexIsChanging) {
        final selected = _tabs[_tabController.index].toLowerCase();
        context.read<OrderProvider>().setStatusFilter(selected);
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

    final filteredOrders = orderProvider.filteredOrders.where((order) {
      if (_searchFilter.isEmpty) return true;
      final q = _searchFilter.toLowerCase();
      return order.orderNumber.toLowerCase().contains(q) ||
          order.customerName.toLowerCase().contains(q) ||
          order.customerPhone.contains(q);
    }).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Live Orders & Kitchen'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(108),
          child: Column(
            children: [
              // Search input
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                child: TextField(
                  controller: _searchController,
                  onChanged: (val) => setState(() => _searchFilter = val),
                  style: const TextStyle(fontSize: 14),
                  decoration: InputDecoration(
                    hintText: 'Search by Order # or Customer...',
                    prefixIcon: const Icon(Icons.search, size: 20),
                    suffixIcon: _searchFilter.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear, size: 18),
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

              // Filter Tabs
              TabBar(
                controller: _tabController,
                isScrollable: true,
                indicatorColor: AppColors.primary,
                labelColor: AppColors.primary,
                unselectedLabelColor: AppColors.textSecondary,
                labelStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
                tabs: _tabs.map((tab) {
                  int badgeCount = 0;
                  if (tab == 'Pending') badgeCount = orderProvider.pendingCount;
                  if (tab == 'Preparing') badgeCount = orderProvider.preparingCount;
                  if (tab == 'Ready') badgeCount = orderProvider.readyCount;

                  return Tab(
                    child: Row(
                      children: [
                        Text(tab),
                        if (badgeCount > 0) ...[
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: tab == 'Pending' ? AppColors.statusPending : AppColors.primary,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Text(
                              '$badgeCount',
                              style: const TextStyle(color: Colors.black, fontSize: 10, fontWeight: FontWeight.w800),
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
        child: filteredOrders.isEmpty
            ? ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                children: [
                  SizedBox(
                    height: MediaQuery.of(context).size.height * 0.5,
                    child: Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.inbox_rounded, size: 54, color: AppColors.textMuted),
                          const SizedBox(height: 12),
                          Text(
                            'No ${_tabs[_tabController.index]} orders found',
                            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.textSecondary),
                          ),
                          const SizedBox(height: 4),
                          const Text(
                            'New orders will appear automatically',
                            style: TextStyle(fontSize: 12, color: AppColors.textMuted),
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
