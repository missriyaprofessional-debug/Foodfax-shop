class MenuItem {
  final String id;
  final String shopId;
  final String? categoryId;
  final String name;
  final String? description;
  final double price;
  final bool isVeg;
  final bool isAvailable;
  final String? imageUrl;
  final int preparationTimeMinutes;
  final String? tag; // 'Bestseller', 'Chef Special', 'Must Try'
  final DateTime? createdAt;

  MenuItem({
    required this.id,
    required this.shopId,
    this.categoryId,
    required this.name,
    this.description,
    required this.price,
    this.isVeg = true,
    this.isAvailable = true,
    this.imageUrl,
    this.preparationTimeMinutes = 15,
    this.tag,
    this.createdAt,
  });

  factory MenuItem.fromJson(Map<String, dynamic> json) {
    return MenuItem(
      id: json['id'] as String,
      shopId: json['shop_id'] as String? ?? '',
      categoryId: json['category_id'] as String?,
      name: json['name'] as String? ?? '',
      description: json['description'] as String?,
      price: (json['price'] as num?)?.toDouble() ?? 0.0,
      isVeg: json['is_veg'] as bool? ?? true,
      isAvailable: json['is_available'] as bool? ?? true,
      imageUrl: json['image_url'] as String?,
      preparationTimeMinutes: json['preparation_time_minutes'] as int? ?? 15,
      tag: json['tag'] as String?,
      createdAt: json['created_at'] != null ? DateTime.parse(json['created_at']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'shop_id': shopId,
      'category_id': categoryId,
      'name': name,
      'description': description,
      'price': price,
      'is_veg': isVeg,
      'is_available': isAvailable,
      'image_url': imageUrl,
      'preparation_time_minutes': preparationTimeMinutes,
      'tag': tag,
    };
  }

  MenuItem copyWith({
    String? categoryId,
    String? name,
    String? description,
    double? price,
    bool? isVeg,
    bool? isAvailable,
    String? imageUrl,
    int? preparationTimeMinutes,
    String? tag,
  }) {
    return MenuItem(
      id: id,
      shopId: shopId,
      categoryId: categoryId ?? this.categoryId,
      name: name ?? this.name,
      description: description ?? this.description,
      price: price ?? this.price,
      isVeg: isVeg ?? this.isVeg,
      isAvailable: isAvailable ?? this.isAvailable,
      imageUrl: imageUrl ?? this.imageUrl,
      preparationTimeMinutes: preparationTimeMinutes ?? this.preparationTimeMinutes,
      tag: tag ?? this.tag,
      createdAt: createdAt,
    );
  }
}
