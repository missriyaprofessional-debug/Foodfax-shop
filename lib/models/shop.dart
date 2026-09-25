class Shop {
  final String id;
  final String ownerId;
  final String name;
  final String? shopType; // 'Restaurant', 'Cafe', 'Bakery', 'Cloud Kitchen', 'Fast Food'
  final String? description;
  final String? phone;
  final String? address;
  final String? area;
  final String? city;
  final String? state;
  final String? pincode;
  final double? latitude;
  final double? longitude;
  final String? openingTime;
  final String? closingTime;
  final String? upiId;
  final String? logoUrl;
  final String? bannerUrl;
  final bool isOpen;
  final bool isRushMode;
  final int rushExtraMinutes;
  final double minimumOrder;
  final bool acceptsTakeaway;
  final bool acceptsDineIn;
  final bool acceptsDelivery;
  final DateTime? createdAt;

  Shop({
    required this.id,
    required this.ownerId,
    required this.name,
    this.shopType,
    this.description,
    this.phone,
    this.address,
    this.area,
    this.city,
    this.state,
    this.pincode,
    this.latitude,
    this.longitude,
    this.openingTime,
    this.closingTime,
    this.upiId,
    this.logoUrl,
    this.bannerUrl,
    this.isOpen = true,
    this.isRushMode = false,
    this.rushExtraMinutes = 15,
    this.minimumOrder = 0.0,
    this.acceptsTakeaway = true,
    this.acceptsDineIn = true,
    this.acceptsDelivery = false,
    this.createdAt,
  });

  factory Shop.fromJson(Map<String, dynamic> json) {
    return Shop(
      id: json['id'] as String? ?? '',
      ownerId: json['owner_id'] as String? ?? json['user_id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      shopType: json['stall_type'] as String? ?? json['shop_type'] as String? ?? json['type'] as String? ?? 'Restaurant',
      description: json['description'] as String?,
      phone: json['phone'] as String? ?? json['contact_phone'] as String?,
      address: json['address'] as String?,
      area: json['area'] as String?,
      city: json['city'] as String?,
      state: json['state'] as String?,
      pincode: json['pincode'] as String?,
      latitude: (json['latitude'] as num?)?.toDouble(),
      longitude: (json['longitude'] as num?)?.toDouble(),
      openingTime: json['opening_time'] as String? ?? '09:00 AM',
      closingTime: json['closing_time'] as String? ?? '10:00 PM',
      upiId: json['upi_id'] as String?,
      logoUrl: json['image'] as String? ?? json['logo_url'] as String?,
      bannerUrl: json['banner_image'] as String? ?? json['banner_url'] as String?,
      isOpen: json['is_open'] as bool? ?? true,
      isRushMode: json['is_rush_hour'] as bool? ?? json['is_rush_mode'] as bool? ?? false,
      rushExtraMinutes: json['rush_extra_minutes'] as int? ?? 15,
      minimumOrder: (json['minimum_order'] as num?)?.toDouble() ?? 0.0,
      acceptsTakeaway: json['accepts_takeaway'] as bool? ?? true,
      acceptsDineIn: json['table_service_available'] as bool? ?? json['accepts_dine_in'] as bool? ?? true,
      acceptsDelivery: json['accepts_delivery'] as bool? ?? false,
      createdAt: json['created_at'] != null ? DateTime.parse(json['created_at']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'owner_id': ownerId,
      'name': name,
      'stall_type': shopType ?? 'Restaurant',
      'description': description,
      'phone': phone,
      'contact_phone': phone,
      'address': address,
      'area': area,
      'city': city,
      'state': state,
      'pincode': pincode,
      'latitude': latitude,
      'longitude': longitude,
      'opening_time': openingTime,
      'closing_time': closingTime,
      'upi_id': upiId,
      'image': logoUrl,
      'banner_image': bannerUrl,
      'is_open': isOpen,
      'is_rush_hour': isRushMode,
      'table_service_available': acceptsDineIn,
      'preparation_time_minutes': isRushMode ? '25-30' : '10-15',
    };
  }

  Shop copyWith({
    String? name,
    String? shopType,
    String? description,
    String? phone,
    String? address,
    String? area,
    String? city,
    String? state,
    String? pincode,
    double? latitude,
    double? longitude,
    String? openingTime,
    String? closingTime,
    String? upiId,
    String? logoUrl,
    String? bannerUrl,
    bool? isOpen,
    bool? isRushMode,
    int? rushExtraMinutes,
    double? minimumOrder,
    bool? acceptsTakeaway,
    bool? acceptsDineIn,
    bool? acceptsDelivery,
  }) {
    return Shop(
      id: id,
      ownerId: ownerId,
      name: name ?? this.name,
      shopType: shopType ?? this.shopType,
      description: description ?? this.description,
      phone: phone ?? this.phone,
      address: address ?? this.address,
      area: area ?? this.area,
      city: city ?? this.city,
      state: state ?? this.state,
      pincode: pincode ?? this.pincode,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      openingTime: openingTime ?? this.openingTime,
      closingTime: closingTime ?? this.closingTime,
      upiId: upiId ?? this.upiId,
      logoUrl: logoUrl ?? this.logoUrl,
      bannerUrl: bannerUrl ?? this.bannerUrl,
      isOpen: isOpen ?? this.isOpen,
      isRushMode: isRushMode ?? this.isRushMode,
      rushExtraMinutes: rushExtraMinutes ?? this.rushExtraMinutes,
      minimumOrder: minimumOrder ?? this.minimumOrder,
      acceptsTakeaway: acceptsTakeaway ?? this.acceptsTakeaway,
      acceptsDineIn: acceptsDineIn ?? this.acceptsDineIn,
      acceptsDelivery: acceptsDelivery ?? this.acceptsDelivery,
      createdAt: createdAt,
    );
  }
}
