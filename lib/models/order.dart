class OrderItem {
  final String id;
  final String? orderId;
  final String menuItemId;
  final String name;
  final double price;
  final int quantity;
  final bool isVeg;
  final String? notes;

  OrderItem({
    required this.id,
    this.orderId,
    required this.menuItemId,
    required this.name,
    required this.price,
    required this.quantity,
    this.isVeg = true,
    this.notes,
  });

  factory OrderItem.fromJson(Map<String, dynamic> json) {
    return OrderItem(
      id: json['id'] as String? ?? UniqueKey().toString(),
      orderId: json['order_id'] as String?,
      menuItemId: json['menu_item_id'] as String? ?? json['item_id'] as String? ?? '',
      name: json['name'] as String? ?? json['title'] as String? ?? '',
      price: (json['price'] as num?)?.toDouble() ?? 0.0,
      quantity: json['quantity'] as int? ?? 1,
      isVeg: json['is_veg'] as bool? ?? true,
      notes: json['notes'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'order_id': orderId,
      'menu_item_id': menuItemId,
      'name': name,
      'price': price,
      'quantity': quantity,
      'is_veg': isVeg,
      'notes': notes,
    };
  }
}

class OwnerOrder {
  final String id;
  final String shopId;
  final String orderNumber;
  final String customerName;
  final String customerPhone;
  final String orderType; // 'dine_in', 'takeaway', 'delivery'
  final String? tableNumber;
  final String status; // 'pending' -> 'accepted' -> 'preparing' -> 'ready' -> 'completed' (or 'cancelled')
  final double subtotal;
  final double tax;
  final double discount;
  final double totalAmount;
  final String paymentStatus; // 'paid', 'pending', 'cod'
  final String paymentMethod; // 'upi', 'cash', 'card'
  final String? cancellationReason;
  final List<OrderItem> items;
  final DateTime createdAt;
  final DateTime? updatedAt;
  final int estimatedPrepMinutes;

  OwnerOrder({
    required this.id,
    required this.shopId,
    required this.orderNumber,
    required this.customerName,
    required this.customerPhone,
    this.orderType = 'takeaway',
    this.tableNumber,
    required this.status,
    required this.subtotal,
    this.tax = 0.0,
    this.discount = 0.0,
    required this.totalAmount,
    this.paymentStatus = 'paid',
    this.paymentMethod = 'upi',
    this.cancellationReason,
    this.items = const [],
    required this.createdAt,
    this.updatedAt,
    this.estimatedPrepMinutes = 20,
  });

  factory OwnerOrder.fromJson(Map<String, dynamic> json) {
    List<OrderItem> parsedItems = [];
    if (json['items'] != null && json['items'] is List) {
      parsedItems = (json['items'] as List)
          .map((i) => OrderItem.fromJson(i as Map<String, dynamic>))
          .toList();
    } else if (json['order_items'] != null && json['order_items'] is List) {
      parsedItems = (json['order_items'] as List)
          .map((i) => OrderItem.fromJson(i as Map<String, dynamic>))
          .toList();
    }

    return OwnerOrder(
      id: json['id'] as String,
      shopId: json['shop_id'] as String? ?? '',
      orderNumber: (json['token_number'] ?? json['order_number'] ?? '#${json['id'].toString().substring(0, 5).toUpperCase()}').toString(),
      customerName: json['customer_name'] as String? ?? 'Guest Customer',
      customerPhone: json['customer_phone'] as String? ?? '',
      orderType: (json['order_type'] ?? 'takeaway').toString().toLowerCase(),
      tableNumber: json['table_number']?.toString(),
      status: (json['order_status'] ?? json['status'] ?? 'pending').toString().toLowerCase(),
      subtotal: (json['subtotal'] as num?)?.toDouble() ?? (json['total'] as num?)?.toDouble() ?? (json['total_amount'] as num?)?.toDouble() ?? 0.0,
      tax: (json['tax'] as num?)?.toDouble() ?? 0.0,
      discount: (json['discount'] as num?)?.toDouble() ?? 0.0,
      totalAmount: (json['total'] as num?)?.toDouble() ?? (json['total_amount'] as num?)?.toDouble() ?? (json['subtotal'] as num?)?.toDouble() ?? 0.0,
      paymentStatus: (json['payment_status'] ?? 'paid').toString().toLowerCase(),
      paymentMethod: (json['payment_method'] ?? 'upi').toString().toLowerCase(),
      cancellationReason: json['cancellation_reason'] as String?,
      items: parsedItems,
      createdAt: json['created_at'] != null ? DateTime.parse(json['created_at']) : DateTime.now(),
      updatedAt: json['updated_at'] != null ? DateTime.parse(json['updated_at']) : null,
      estimatedPrepMinutes: json['estimated_prep_minutes'] as int? ?? 20,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'shop_id': shopId,
      'order_number': orderNumber,
      'customer_name': customerName,
      'customer_phone': customerPhone,
      'order_type': orderType,
      'table_number': tableNumber,
      'status': status,
      'subtotal': subtotal,
      'tax': tax,
      'discount': discount,
      'total_amount': totalAmount,
      'payment_status': paymentStatus,
      'payment_method': paymentMethod,
      'cancellation_reason': cancellationReason,
      'estimated_prep_minutes': estimatedPrepMinutes,
    };
  }

  OwnerOrder copyWith({
    String? status,
    String? cancellationReason,
    int? estimatedPrepMinutes,
    DateTime? updatedAt,
  }) {
    return OwnerOrder(
      id: id,
      shopId: shopId,
      orderNumber: orderNumber,
      customerName: customerName,
      customerPhone: customerPhone,
      orderType: orderType,
      tableNumber: tableNumber,
      status: status ?? this.status,
      subtotal: subtotal,
      tax: tax,
      discount: discount,
      totalAmount: totalAmount,
      paymentStatus: paymentStatus,
      paymentMethod: paymentMethod,
      cancellationReason: cancellationReason ?? this.cancellationReason,
      items: items,
      createdAt: createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      estimatedPrepMinutes: estimatedPrepMinutes ?? this.estimatedPrepMinutes,
    );
  }
}

class UniqueKey {
  static int _c = 0;
  @override
  String toString() => 'key_${DateTime.now().millisecondsSinceEpoch}_${++_c}';
}
