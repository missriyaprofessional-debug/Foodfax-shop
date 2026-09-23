import '../models/category.dart';
import '../models/menu_item.dart';
import '../services/menu_service.dart';

class MenuRepository {
  final MenuService _menuService;

  MenuRepository({MenuService? menuService}) : _menuService = menuService ?? MenuService();

  Future<List<MenuCategory>> fetchCategories(String shopId) => _menuService.fetchCategories(shopId);

  Future<MenuCategory> createCategory(String shopId, String name, {String? description}) =>
      _menuService.createCategory(shopId, name, description: description);

  Future<List<MenuItem>> fetchMenuItems(String shopId, {String? categoryId}) =>
      _menuService.fetchMenuItems(shopId, categoryId: categoryId);

  Future<MenuItem> saveMenuItem(MenuItem item) => _menuService.saveMenuItem(item);

  Future<void> toggleItemAvailability(String itemId, bool isAvailable) =>
      _menuService.toggleItemAvailability(itemId, isAvailable);

  Future<void> deleteMenuItem(String itemId) => _menuService.deleteMenuItem(itemId);
}
