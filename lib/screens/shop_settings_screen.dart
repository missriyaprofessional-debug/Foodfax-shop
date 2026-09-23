import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/shop_provider.dart';
import '../services/audio_service.dart';
import '../theme/app_colors.dart';

class ShopSettingsScreen extends StatefulWidget {
  const ShopSettingsScreen({super.key});

  @override
  State<ShopSettingsScreen> createState() => _ShopSettingsScreenState();
}

class _ShopSettingsScreenState extends State<ShopSettingsScreen> {
  final AudioService _audio = AudioService();
  bool _soundEnabled = true;

  @override
  void initState() {
    super.initState();
    _soundEnabled = _audio.isSoundEnabled;
  }

  @override
  Widget build(BuildContext context) {
    final shopProvider = context.watch<ShopProvider>();
    final shop = shopProvider.currentShop;

    if (shop == null) return const Scaffold(body: Center(child: CircularProgressIndicator()));

    return Scaffold(
      appBar: AppBar(title: const Text('Shop Operations & Settings')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Order Receiving Modes
          _buildSectionHeader('Store Status & Operations'),
          SwitchListTile(
            value: shop.isOpen,
            onChanged: (val) => shopProvider.toggleShopOpen(val),
            title: const Text('Accepting Customer Orders', style: TextStyle(fontWeight: FontWeight.w700)),
            subtitle: Text(shop.isOpen ? 'Store is LIVE on FoodFax' : 'Store is paused / closed',
                style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
            activeColor: Colors.emerald,
          ),
          const Divider(color: AppColors.cardBorder),

          // Rush Mode
          SwitchListTile(
            value: shop.isRushMode,
            onChanged: (val) => shopProvider.toggleRushMode(val),
            title: const Text('Kitchen Rush Mode', style: TextStyle(fontWeight: FontWeight.w700)),
            subtitle: Text(
              'Adds +${shop.rushExtraMinutes} mins to estimated preparation time shown to customers',
              style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
            ),
            activeColor: Colors.redAccent,
          ),
          const Divider(color: AppColors.cardBorder),

          // Sound notifications
          _buildSectionHeader('Kitchen Alarms & Sound'),
          SwitchListTile(
            value: _soundEnabled,
            onChanged: (val) {
              setState(() => _soundEnabled = val);
              _audio.setSoundEnabled(val);
            },
            title: const Text('Play Sound on New Order', style: TextStyle(fontWeight: FontWeight.w700)),
            subtitle: const Text('Repeats chime when pending order arrives', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
            activeColor: AppColors.primary,
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: OutlinedButton.icon(
              onPressed: () => _audio.playNewOrderAlert(),
              icon: const Icon(Icons.volume_up, size: 18),
              label: const Text('Test Order Alarm Chime'),
            ),
          ),
          const Divider(color: AppColors.cardBorder),

          // Fulfilment Types
          _buildSectionHeader('Order Types Accepted'),
          CheckboxListTile(
            value: shop.acceptsDineIn,
            onChanged: (val) {
              if (val != null) {
                shopProvider.saveShop(shop.copyWith(acceptsDineIn: val));
              }
            },
            title: const Text('Dine-In Table Ordering'),
            subtitle: const Text('Customers scan QR code at table to order', style: TextStyle(fontSize: 12)),
            activeColor: AppColors.primary,
          ),
          CheckboxListTile(
            value: shop.acceptsTakeaway,
            onChanged: (val) {
              if (val != null) {
                shopProvider.saveShop(shop.copyWith(acceptsTakeaway: val));
              }
            },
            title: const Text('Takeaway & Counter Pickup'),
            subtitle: const Text('Customers order in advance and pickup at counter', style: TextStyle(fontSize: 12)),
            activeColor: AppColors.primary,
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      child: Text(
        title.toUpperCase(),
        style: const TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w800,
          color: AppColors.primary,
          letterSpacing: 0.8,
        ),
      ),
    );
  }
}
