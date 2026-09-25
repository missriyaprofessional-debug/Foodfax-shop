import 'package:supabase_flutter/supabase_flutter.dart';
import '../core/supabase_client.dart';
import '../models/shop.dart';

class ShopService {
  final SupabaseClient _client = SupabaseService.client;

  /// Fetch the owner's shop
  Future<Shop?> fetchShopByOwner(String ownerId) async {
    try {
      final res = await _client
          .from('shops')
          .select()
          .eq('owner_id', ownerId)
          .maybeSingle();

      if (res != null) {
        return Shop.fromJson(res);
      }
    } catch (_) {
      try {
        final res = await _client
            .from('restaurants')
            .select()
            .eq('owner_id', ownerId)
            .maybeSingle();

        if (res != null) {
          return Shop.fromJson(res);
        }
      } catch (_) {}
    }
    return null;
  }

  /// Create or update shop setup
  Future<Shop> saveShop(Shop shop) async {
    final data = shop.toJson();
    if (shop.id.isEmpty) {
      data.remove('id');
    }

    try {
      final res = await _client
          .from('shops')
          .upsert(data)
          .select()
          .single();
      return Shop.fromJson(res);
    } catch (_) {
      final res = await _client
          .from('restaurants')
          .upsert(data)
          .select()
          .single();
      return Shop.fromJson(res);
    }
  }

  /// Toggle Shop Open/Closed status
  Future<void> toggleShopStatus(String shopId, bool isOpen) async {
    try {
      await _client
          .from('shops')
          .update({'is_open': isOpen, 'updated_at': DateTime.now().toIso8601String()})
          .eq('id', shopId);
    } catch (_) {
      await _client
          .from('restaurants')
          .update({'is_open': isOpen})
          .eq('id', shopId);
    }
  }

  /// Toggle Rush Mode
  Future<void> toggleRushMode(String shopId, bool isRushMode, {int extraMinutes = 15}) async {
    try {
      await _client.from('shops').update({
        'is_rush_hour': isRushMode,
        'preparation_time_minutes': isRushMode ? '${extraMinutes + 10} min' : '10-15 min',
        'updated_at': DateTime.now().toIso8601String(),
      }).eq('id', shopId);
    } catch (_) {
      try {
        await _client.from('shops').update({
          'is_rush_mode': isRushMode,
          'rush_extra_minutes': extraMinutes,
        }).eq('id', shopId);
      } catch (_) {}
    }
  }
}
