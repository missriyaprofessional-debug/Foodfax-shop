import 'dart:async';
import 'package:flutter/material.dart';
import '../models/order.dart';
import '../repositories/order_repository.dart';
import '../services/audio_service.dart';

class OrderProvider extends ChangeNotifier {
  final OrderRepository _repository;
  final AudioService _audioService = AudioService();

  List<OwnerOrder> _orders = [];
  bool _isLoading = false;
  String _selectedStatus = 'all';
  String? _errorMessage;
  StreamSubscription? _realtimeSubscription;

  OrderProvider({OrderRepository? repository}) : _repository = repository ?? OrderRepository();

  List<OwnerOrder> get orders => _orders;
  bool get isLoading => _isLoading;
  String get selectedStatus => _selectedStatus;
  String? get errorMessage => _errorMessage;

  List<OwnerOrder> get filteredOrders {
    if (_selectedStatus == 'all') return _orders;
    return _orders.where((o) => o.status.toLowerCase() == _selectedStatus.toLowerCase()).toList();
  }

  // Quick stats
  int get pendingCount => _orders.where((o) => o.status == 'pending').length;
  int get acceptedCount => _orders.where((o) => o.status == 'accepted').length;
  int get preparingCount => _orders.where((o) => o.status == 'preparing').length;
  int get readyCount => _orders.where((o) => o.status == 'ready').length;
  int get completedCount => _orders.where((o) => o.status == 'completed').length;
  int get activeOrdersCount => _orders.where((o) => ['pending', 'accepted', 'preparing', 'ready'].contains(o.status)).length;

  int get todayOrdersCount {
    final now = DateTime.now();
    return _orders
        .where((o) =>
            o.createdAt.year == now.year &&
            o.createdAt.month == now.month &&
            o.createdAt.day == now.day)
        .length;
  }

  int get todayCompletedCount {
    final now = DateTime.now();
    return _orders
        .where((o) =>
            o.status == 'completed' &&
            o.createdAt.year == now.year &&
            o.createdAt.month == now.month &&
            o.createdAt.day == now.day)
        .length;
  }

  double get todayRevenue {
    final now = DateTime.now();
    return _orders
        .where((o) =>
            o.status != 'cancelled' &&
            o.createdAt.year == now.year &&
            o.createdAt.month == now.month &&
            o.createdAt.day == now.day)
        .fold(0.0, (sum, o) => sum + o.totalAmount);
  }

  void setStatusFilter(String status) {
    _selectedStatus = status;
    notifyListeners();
  }

  /// Initialize and load orders for shop
  Future<void> initForShop(String shopId) async {
    _isLoading = true;
    notifyListeners();

    try {
      _orders = await _repository.fetchOrders(shopId);
      _isLoading = false;
      notifyListeners();

      _setupRealtime(shopId);
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
    }
  }

  void _setupRealtime(String shopId) {
    _realtimeSubscription?.cancel();
    _realtimeSubscription = _repository.subscribeToOrders(shopId).listen((data) {
      final prevPending = pendingCount;
      _orders = data.map((json) => OwnerOrder.fromJson(json)).toList();

      // If new pending order arrived, chime
      if (pendingCount > prevPending) {
        _audioService.playNewOrderAlert();
      }
      notifyListeners();
    });
  }

  /// Update order status
  Future<bool> updateStatus(
    String orderId,
    String newStatus, {
    String? cancellationReason,
    int? estimatedPrepMinutes,
  }) async {
    final index = _orders.indexWhere((o) => o.id == orderId);
    if (index == -1) return false;

    final oldOrder = _orders[index];
    _orders[index] = oldOrder.copyWith(
      status: newStatus,
      cancellationReason: cancellationReason,
      estimatedPrepMinutes: estimatedPrepMinutes,
      updatedAt: DateTime.now(),
    );
    notifyListeners();

    try {
      await _repository.updateOrderStatus(
        orderId: orderId,
        newStatus: newStatus,
        cancellationReason: cancellationReason,
        estimatedPrepMinutes: estimatedPrepMinutes,
      );
      return true;
    } catch (e) {
      // Revert on error
      _orders[index] = oldOrder;
      notifyListeners();
      return false;
    }
  }

  @override
  void dispose() {
    _realtimeSubscription?.cancel();
    _repository.unsubscribe();
    super.dispose();
  }
}
