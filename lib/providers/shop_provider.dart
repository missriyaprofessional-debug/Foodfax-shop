import 'package:flutter/material.dart';
import '../models/shop.dart';
import '../repositories/shop_repository.dart';

class ShopProvider extends ChangeNotifier {
  final ShopRepository _repository;

  Shop? _currentShop;
  bool _isLoading = false;
  bool _isCheckingSetup = false;
  String? _errorMessage;

  ShopProvider({ShopRepository? repository}) : _repository = repository ?? ShopRepository();

  Shop? get currentShop => _currentShop;
  bool get isLoading => _isLoading;
  bool get isCheckingSetup => _isCheckingSetup;
  String? get errorMessage => _errorMessage;
  bool get hasCompletedShopSetup => _currentShop != null && _currentShop!.name.isNotEmpty;

  /// Check owner shop setup
  Future<bool> checkShopSetup(String ownerId) async {
    _isCheckingSetup = true;
    notifyListeners();

    try {
      _currentShop = await _repository.fetchShopByOwner(ownerId);
      _isCheckingSetup = false;
      notifyListeners();
      return hasCompletedShopSetup;
    } catch (e) {
      _errorMessage = e.toString();
      _isCheckingSetup = false;
      notifyListeners();
      return false;
    }
  }

  /// Save or create shop
  Future<bool> saveShop(Shop shop) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _currentShop = await _repository.saveShop(shop);
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  /// Toggle Open/Close
  Future<void> toggleShopOpen(bool isOpen) async {
    if (_currentShop == null) return;
    final updatedShop = _currentShop!.copyWith(isOpen: isOpen);
    _currentShop = updatedShop;
    notifyListeners();

    try {
      await _repository.toggleShopStatus(_currentShop!.id, isOpen);
    } catch (e) {
      // Revert if error
      _currentShop = _currentShop!.copyWith(isOpen: !isOpen);
      notifyListeners();
    }
  }

  /// Toggle Rush Mode
  Future<void> toggleRushMode(bool isRush, {int extraMinutes = 15}) async {
    if (_currentShop == null) return;
    final updatedShop = _currentShop!.copyWith(
      isRushMode: isRush,
      rushExtraMinutes: extraMinutes,
    );
    _currentShop = updatedShop;
    notifyListeners();

    try {
      await _repository.toggleRushMode(_currentShop!.id, isRush, extraMinutes: extraMinutes);
    } catch (e) {
      _currentShop = _currentShop!.copyWith(isRushMode: !isRush);
      notifyListeners();
    }
  }
}
