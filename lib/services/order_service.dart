import 'dart:async';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../core/supabase_client.dart';
import '../models/order.dart';

class OrderService {
  final SupabaseClient _client = SupabaseService.client;
  RealtimeChannel? _orderChannel;

  /// Fetch orders for shop
  Future<List<OwnerOrder>> fetchOrders(String shopId, {String? status}) async {
    var query = _client
        .from('orders')
        .select('*, order_items(*)')
        .eq('shop_id', shopId)
        .order('created_at', ascending: false);

    if (status != null && status != 'all') {
      final uppercaseStatus = status.toUpperCase();
      query = query.or('order_status.eq.$uppercaseStatus,order_status.eq.$status');
    }

    final res = await query;
    return (res as List).map((o) => OwnerOrder.fromJson(o)).toList();
  }

  /// Listen for Realtime order events for this shop
  Stream<List<Map<String, dynamic>>> subscribeToOrders(String shopId) {
    return _client
        .from('orders')
        .stream(primaryKey: ['id'])
        .eq('shop_id', shopId)
        .order('created_at', ascending: false);
  }

  /// Update order status
  Future<void> updateOrderStatus({
    required String orderId,
    required String newStatus,
    String? cancellationReason,
    int? estimatedPrepMinutes,
  }) async {
    final String uppercaseStatus = newStatus.toUpperCase();
    final Map<String, dynamic> updateData = {
      'order_status': uppercaseStatus,
      'updated_at': DateTime.now().toIso8601String(),
    };

    if (uppercaseStatus == 'COMPLETED') {
      updateData['completed_at'] = DateTime.now().toIso8601String();
      updateData['payment_status'] = 'PAID';
    }

    if (cancellationReason != null) {
      updateData['cancellation_reason'] = cancellationReason;
    }
    if (estimatedPrepMinutes != null) {
      updateData['estimated_preparation_minutes'] = '$estimatedPrepMinutes';
    }

    await _client.from('orders').update(updateData).eq('id', orderId);
  }

  void unsubscribe() {
    _orderChannel?.unsubscribe();
    _orderChannel = null;
  }
}
