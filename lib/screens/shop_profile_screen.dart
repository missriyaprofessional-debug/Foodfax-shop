import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/shop_provider.dart';
import '../theme/app_colors.dart';
import '../widgets/custom_button.dart';
import '../widgets/custom_text_field.dart';
import '../core/error_handler.dart';

class ShopProfileScreen extends StatefulWidget {
  const ShopProfileScreen({super.key});

  @override
  State<ShopProfileScreen> createState() => _ShopProfileScreenState();
}

class _ShopProfileScreenState extends State<ShopProfileScreen> {
  final _formKey = GlobalKey<FormState>();

  late TextEditingController _nameController;
  late TextEditingController _typeController;
  late TextEditingController _descController;
  late TextEditingController _phoneController;
  late TextEditingController _addressController;
  late TextEditingController _areaController;
  late TextEditingController _cityController;
  late TextEditingController _pincodeController;
  late TextEditingController _openTimeController;
  late TextEditingController _closeTimeController;
  late TextEditingController _upiController;

  @override
  void initState() {
    super.initState();
    final shop = context.read<ShopProvider>().currentShop;
    _nameController = TextEditingController(text: shop?.name ?? '');
    _typeController = TextEditingController(text: shop?.shopType ?? 'Restaurant');
    _descController = TextEditingController(text: shop?.description ?? '');
    _phoneController = TextEditingController(text: shop?.phone ?? '');
    _addressController = TextEditingController(text: shop?.address ?? '');
    _areaController = TextEditingController(text: shop?.area ?? '');
    _cityController = TextEditingController(text: shop?.city ?? '');
    _pincodeController = TextEditingController(text: shop?.pincode ?? '');
    _openTimeController = TextEditingController(text: shop?.openingTime ?? '09:00 AM');
    _closeTimeController = TextEditingController(text: shop?.closingTime ?? '10:00 PM');
    _upiController = TextEditingController(text: shop?.upiId ?? '');
  }

  @override
  void dispose() {
    _nameController.dispose();
    _typeController.dispose();
    _descController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    _areaController.dispose();
    _cityController.dispose();
    _pincodeController.dispose();
    _openTimeController.dispose();
    _closeTimeController.dispose();
    _upiController.dispose();
    super.dispose();
  }

  Future<void> _handleUpdate() async {
    if (!_formKey.currentState!.validate()) return;
    final shopProvider = context.read<ShopProvider>();
    final shop = shopProvider.currentShop;
    if (shop == null) return;

    final updated = shop.copyWith(
      name: _nameController.text.trim(),
      shopType: _typeController.text.trim(),
      description: _descController.text.trim(),
      phone: _phoneController.text.trim(),
      address: _addressController.text.trim(),
      area: _areaController.text.trim(),
      city: _cityController.text.trim(),
      pincode: _pincodeController.text.trim(),
      openingTime: _openTimeController.text.trim(),
      closingTime: _closeTimeController.text.trim(),
      upiId: _upiController.text.trim(),
    );

    final success = await shopProvider.saveShop(updated);
    if (!mounted) return;

    if (success) {
      AppErrorHandler.showSuccessSnackBar(context, 'Shop details updated successfully!');
      Navigator.pop(context);
    } else {
      AppErrorHandler.showErrorSnackBar(context, shopProvider.errorMessage ?? 'Update failed');
    }
  }

  @override
  Widget build(BuildContext context) {
    final shopProvider = context.watch<ShopProvider>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Restaurant Profile'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              CustomTextField(
                controller: _nameController,
                label: 'Restaurant Name',
                validator: (v) => (v == null || v.isEmpty) ? 'Name is required' : null,
              ),
              const SizedBox(height: 16),
              CustomTextField(
                controller: _typeController,
                label: 'Cuisine / Shop Type',
              ),
              const SizedBox(height: 16),
              CustomTextField(
                controller: _descController,
                label: 'Description / Tagline',
                maxLines: 2,
              ),
              const SizedBox(height: 16),
              CustomTextField(
                controller: _phoneController,
                label: 'Contact Phone',
                keyboardType: TextInputType.phone,
              ),
              const SizedBox(height: 16),
              CustomTextField(
                controller: _addressController,
                label: 'Street Address',
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(child: CustomTextField(controller: _areaController, label: 'Area')),
                  const SizedBox(width: 12),
                  Expanded(child: CustomTextField(controller: _cityController, label: 'City')),
                ],
              ),
              const SizedBox(height: 16),
              CustomTextField(
                controller: _pincodeController,
                label: 'Pincode',
                keyboardType: TextInputType.number,
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(child: CustomTextField(controller: _openTimeController, label: 'Opens At')),
                  const SizedBox(width: 12),
                  Expanded(child: CustomTextField(controller: _closeTimeController, label: 'Closes At')),
                ],
              ),
              const SizedBox(height: 16),
              CustomTextField(
                controller: _upiController,
                label: 'UPI ID for Direct Payouts',
                hint: 'partner@okaxis',
              ),
              const SizedBox(height: 32),
              CustomButton(
                text: 'Save Changes',
                isLoading: shopProvider.isLoading,
                onPressed: _handleUpdate,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
