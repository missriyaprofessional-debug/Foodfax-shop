class MenuCategory {
  final String id;
  final String shopId;
  final String name;
  final String? description;
  final int sortOrder;
  final bool isActive;

  MenuCategory({
    required this.id,
    required this.shopId,
    required this.name,
    this.description,
    this.sortOrder = 0,
    this.isActive = true,
  });

  factory MenuCategory.fromJson(Map<String, dynamic> json) {
    return MenuCategory(
      id: json['id'] as String,
      shopId: json['shop_id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      description: json['description'] as String?,
      sortOrder: json['sort_order'] as int? ?? 0,
      isActive: json['is_active'] as bool? ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'shop_id': shopId,
      'name': name,
      'description': description,
      'sort_order': sortOrder,
      'is_active': isActive,
    };
  }
}
