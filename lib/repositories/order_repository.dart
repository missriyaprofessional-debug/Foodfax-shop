import '../models/order.dart';
import '../services/order_service.dart';

class OrderRepository {
  final OrderService _orderService;

  OrderRepository({OrderService? orderService}) : _orderService = orderService ?? OrderService();

  Future<List<OwnerOrder>> fetchOrders(String shopId, {String? status}) =>
      _orderService.fetchOrders(shopId, status: status);

  Stream<List<Map<String, dynamic>>> subscribeToOrders(String shopId) =>
      _orderService.subscribeToOrders(shopId);

  Future<void> updateOrderStatus({
    required String orderId,
    required String newStatus,
    String? cancellationReason,
    int? estimatedPrepMinutes,
  }) =>
      _orderService.updateOrderStatus(
        orderId: orderId,
        newStatus: newStatus,
        cancellationReason: cancellationReason,
        estimatedPrepMinutes: estimatedPrepMinutes,
      );

  void unsubscribe() => _orderService.unsubscribe();
}
