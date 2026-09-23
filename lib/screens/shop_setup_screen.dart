import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:geolocator/geolocator.dart';
import '../providers/auth_provider.dart';
import '../providers/shop_provider.dart';
import '../models/shop.dart';
import '../theme/app_colors.dart';
import '../widgets/custom_button.dart';
import '../widgets/custom_text_field.dart';
import '../core/error_handler.dart';

class ShopSetupScreen extends StatefulWidget {
  const ShopSetupScreen({super.key});

  @override
  State<ShopSetupScreen> createState() => _ShopSetupScreenState();
}

class _ShopSetupScreenState extends State<ShopSetupScreen> {
  final _formKey = GlobalKey<FormState>();

  final _ownerNameController = TextEditingController();
  final _shopNameController = TextEditingController();
  final _taglineController = TextEditingController();
  final _phoneController = TextEditingController();
  final _addressController = TextEditingController();
  final _areaController = TextEditingController();
  final _cityController = TextEditingController();
  final _stateController = TextEditingController();
  final _pincodeController = TextEditingController();
  final _openingTimeController = TextEditingController(text: '09:00 AM');
  final _closingTimeController = TextEditingController(text: '10:00 PM');
  final _upiIdController = TextEditingController();

  String _selectedShopType = 'Restaurant';
  final List<String> _shopTypes = [
    'Restaurant',
    'Cafe',
    'Fast Food',
    'Bakery & Desserts',
    'Cloud Kitchen',
    'Beverages & Juices',
    'Food Truck',
  ];

  double? _latitude;
  double? _longitude;
  bool _isFetchingLocation = false;

  @override
  void initState() {
    super.initState();
    final auth = context.read<OwnerAuthProvider>();
    if (auth.currentProfile != null) {
      _ownerNameController.text = auth.currentProfile!.fullName ?? '';
      _phoneController.text = auth.currentProfile!.phone ?? '';
    }
  }

  @override
  void dispose() {
    _ownerNameController.dispose();
    _shopNameController.dispose();
    _taglineController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    _areaController.dispose();
    _cityController.dispose();
    _stateController.dispose();
    _pincodeController.dispose();
    _openingTimeController.dispose();
    _closingTimeController.dispose();
    _upiIdController.dispose();
    super.dispose();
  }

  Future<void> _detectLocation() async {
    setState(() => _isFetchingLocation = true);
    try {
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          throw Exception('Location permission was denied');
        }
      }

      if (permission == LocationPermission.deniedForever) {
        throw Exception('Location permissions are permanently denied, please set manually.');
      }

      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );

      setState(() {
        _latitude = position.latitude;
        _longitude = position.longitude;
      });

      if (mounted) {
        AppErrorHandler.showSuccessSnackBar(
          context,
          'Location captured: ${_latitude?.toStringAsFixed(4)}, ${_longitude?.toStringAsFixed(4)}',
        );
      }
    } catch (e) {
      if (mounted) {
        AppErrorHandler.showErrorSnackBar(context, e.toString());
      }
    } finally {
      if (mounted) {
        setState(() => _isFetchingLocation = false);
      }
    }
  }

  Future<void> _handleSaveShop() async {
    if (!_formKey.currentState!.validate()) return;

    final auth = context.read<OwnerAuthProvider>();
    final shopProvider = context.read<ShopProvider>();

    if (auth.currentProfile == null) {
      AppErrorHandler.showErrorSnackBar(context, 'You must be logged in to create a shop.');
      return;
    }

    final newShop = Shop(
      id: '',
      ownerId: auth.currentProfile!.id,
      name: _shopNameController.text.trim(),
      shopType: _selectedShopType,
      description: _taglineController.text.trim(),
      phone: _phoneController.text.trim(),
      address: _addressController.text.trim(),
      area: _areaController.text.trim(),
      city: _cityController.text.trim(),
      state: _stateController.text.trim(),
      pincode: _pincodeController.text.trim(),
      latitude: _latitude,
      longitude: _longitude,
      openingTime: _openingTimeController.text.trim(),
      closingTime: _closingTimeController.text.trim(),
      upiId: _upiIdController.text.trim(),
      isOpen: true,
      isRushMode: false,
    );

    final success = await shopProvider.saveShop(newShop);
    if (!mounted) return;

    if (success) {
      AppErrorHandler.showSuccessSnackBar(context, 'Shop profile created successfully!');
      context.go('/dashboard');
    } else if (shopProvider.errorMessage != null) {
      AppErrorHandler.showErrorSnackBar(context, shopProvider.errorMessage!);
    }
  }

  @override
  Widget build(BuildContext context) {
    final shopProvider = context.watch<ShopProvider>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Shop Setup & Onboarding'),
        automaticallyImplyLeading: false,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header badge
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.store, color: AppColors.primary, size: 16),
                      SizedBox(width: 6),
                      Text(
                        'STEP 1 OF 1: RESTAURANT PROFILE',
                        style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.w700, fontSize: 11),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                const Text(
                  'Set Up Your FoodFax Store',
                  style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
                ),
                const SizedBox(height: 6),
                const Text(
                  'Enter your business details to configure your digital menu and QR ordering counter.',
                  style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
                ),
                const SizedBox(height: 24),

                // Section 1: Basic Info
                _buildSectionHeader('Basic Restaurant Info'),
                CustomTextField(
                  controller: _ownerNameController,
                  label: 'Owner Full Name',
                  hint: 'John Doe',
                  prefixIcon: Icons.person_outline,
                  validator: (v) => (v == null || v.isEmpty) ? 'Please enter owner name' : null,
                ),
                const SizedBox(height: 16),

                CustomTextField(
                  controller: _shopNameController,
                  label: 'Restaurant / Shop Name',
                  hint: 'e.g. Royal Spice Bistro',
                  prefixIcon: Icons.storefront_outlined,
                  validator: (v) => (v == null || v.isEmpty) ? 'Please enter restaurant name' : null,
                ),
                const SizedBox(height: 16),

                // Shop Type Dropdown
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Shop Type / Cuisine Category',
                      style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textSecondary),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.cardBorder),
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          value: _selectedShopType,
                          isExpanded: true,
                          dropdownColor: AppColors.surface,
                          items: _shopTypes.map((type) {
                            return DropdownMenuItem(value: type, child: Text(type));
                          }).toList(),
                          onChanged: (val) {
                            if (val != null) setState(() => _selectedShopType = val);
                          },
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                CustomTextField(
                  controller: _taglineController,
                  label: 'Tagline / Short Description',
                  hint: 'Authentic North Indian curries, tandoor & fast bites',
                  prefixIcon: Icons.description_outlined,
                  maxLines: 2,
                ),
                const SizedBox(height: 16),

                CustomTextField(
                  controller: _phoneController,
                  label: 'Restaurant Phone Number',
                  hint: '+91 98765 43210',
                  prefixIcon: Icons.phone_outlined,
                  keyboardType: TextInputType.phone,
                  validator: (v) => (v == null || v.isEmpty) ? 'Please enter phone' : null,
                ),
                const SizedBox(height: 24),

                // Section 2: Address & Location
                _buildSectionHeader('Location & Address'),
                CustomTextField(
                  controller: _addressController,
                  label: 'Street Address',
                  hint: 'Shop #12, Ground Floor, Market Complex',
                  prefixIcon: Icons.location_on_outlined,
                  validator: (v) => (v == null || v.isEmpty) ? 'Please enter address' : null,
                ),
                const SizedBox(height: 16),

                Row(
                  children: [
                    Expanded(
                      child: CustomTextField(
                        controller: _areaController,
                        label: 'Area / Landmark',
                        hint: 'Koramangala 5th Block',
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: CustomTextField(
                        controller: _cityController,
                        label: 'City',
                        hint: 'Bengaluru',
                        validator: (v) => (v == null || v.isEmpty) ? 'Enter city' : null,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                Row(
                  children: [
                    Expanded(
                      child: CustomTextField(
                        controller: _stateController,
                        label: 'State',
                        hint: 'Karnataka',
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: CustomTextField(
                        controller: _pincodeController,
                        label: 'Pincode',
                        hint: '560095',
                        keyboardType: TextInputType.number,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                // GPS Location Capture Button
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.cardBorder),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(Icons.my_location, color: AppColors.primary, size: 20),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Shop GPS Coordinates', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                            Text(
                              _latitude != null
                                  ? '${_latitude!.toStringAsFixed(4)}, ${_longitude!.toStringAsFixed(4)}'
                                  : 'Not yet captured',
                              style: TextStyle(
                                fontSize: 12,
                                color: _latitude != null ? Colors.greenAccent : AppColors.textMuted,
                              ),
                            ),
                          ],
                        ),
                      ),
                      ElevatedButton(
                        onPressed: _isFetchingLocation ? null : _detectLocation,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                          minimumSize: Size.zero,
                        ),
                        child: _isFetchingLocation
                            ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                            : const Text('Get GPS', style: TextStyle(fontSize: 12)),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // Section 3: Operating Hours & Payments
                _buildSectionHeader('Hours & Payments'),
                Row(
                  children: [
                    Expanded(
                      child: CustomTextField(
                        controller: _openingTimeController,
                        label: 'Opening Time',
                        hint: '09:00 AM',
                        prefixIcon: Icons.access_time,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: CustomTextField(
                        controller: _closingTimeController,
                        label: 'Closing Time',
                        hint: '10:00 PM',
                        prefixIcon: Icons.access_time_filled,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                CustomTextField(
                  controller: _upiIdController,
                  label: 'Shop UPI ID for Customer Payouts',
                  hint: 'restaurantname@okaxis / upi@bank',
                  prefixIcon: Icons.account_balance_wallet_outlined,
                ),
                const SizedBox(height: 32),

                // Save button
                CustomButton(
                  text: 'Complete Setup & Launch Dashboard',
                  isLoading: shopProvider.isLoading,
                  onPressed: _handleSaveShop,
                ),
                const SizedBox(height: 24),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Text(
        title,
        style: const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w700,
          color: AppColors.primary,
        ),
      ),
    );
  }
}
