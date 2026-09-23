import 'package:supabase_flutter/supabase_flutter.dart';
import '../core/supabase_client.dart';
import '../models/category.dart';
import '../models/menu_item.dart';

class MenuService {
  final SupabaseClient _client = SupabaseService.client;

  /// Fetch Categories
  Future<List<MenuCategory>> fetchCategories(String shopId) async {
    final res = await _client
        .from('categories')
        .select()
        .eq('shop_id', shopId)
        .order('sort_order', ascending: true);
    return (res as List).map((c) => MenuCategory.fromJson(c)).toList();
  }

  /// Create Category
  Future<MenuCategory> createCategory(String shopId, String name, {String? description}) async {
    final res = await _client.from('categories').insert({
      'shop_id': shopId,
      'name': name.trim(),
      'description': description?.trim(),
      'is_active': true,
    }).select().single();
    return MenuCategory.fromJson(res);
  }

  /// Fetch Menu Items
  Future<List<MenuItem>> fetchMenuItems(String shopId, {String? categoryId}) async {
    var query = _client
        .from('menu_items')
        .select()
        .eq('shop_id', shopId)
        .order('name', ascending: true);

    if (categoryId != null && categoryId != 'all') {
      query = query.eq('category_id', categoryId);
    }

    final res = await query;
    return (res as List).map((m) => MenuItem.fromJson(m)).toList();
  }

  /// Save or Update Menu Item
  Future<MenuItem> saveMenuItem(MenuItem item) async {
    final data = item.toJson();
    if (item.id.isEmpty) {
      data.remove('id');
    }

    final res = await _client
        .from('menu_items')
        .upsert(data)
        .select()
        .single();
    return MenuItem.fromJson(res);
  }

  /// Toggle item availability
  Future<void> toggleItemAvailability(String itemId, bool isAvailable) async {
    await _client.from('menu_items').update({
      'is_available': isAvailable,
    }).eq('id', itemId);
  }

  /// Delete menu item
  Future<void> deleteMenuItem(String itemId) async {
    await _client.from('menu_items').delete().eq('id', itemId);
  }
}
