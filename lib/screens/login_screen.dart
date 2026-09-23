import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../providers/shop_provider.dart';
import '../theme/app_colors.dart';
import '../widgets/custom_button.dart';
import '../widgets/custom_text_field.dart';
import '../core/error_handler.dart';

class OwnerLoginScreen extends StatefulWidget {
  const OwnerLoginScreen({super.key});

  @override
  State<OwnerLoginScreen> createState() => _OwnerLoginScreenState();
}

class _OwnerLoginScreenState extends State<OwnerLoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  final _otpController = TextEditingController();

  String _countryCode = '+91';
  bool _obscurePassword = true;
  bool _useOtpMode = false;
  bool _otpSent = false;

  @override
  void dispose() {
    _phoneController.dispose();
    _passwordController.dispose();
    _otpController.dispose();
    super.dispose();
  }

  String get _fullPhoneNumber => '$_countryCode${_phoneController.text.trim()}';

  Future<void> _handlePasswordLogin() async {
    if (!_formKey.currentState!.validate()) return;

    final auth = context.read<OwnerAuthProvider>();
    final shopProvider = context.read<ShopProvider>();

    final success = await auth.loginWithPhone(
      _fullPhoneNumber,
      _passwordController.text,
    );

    if (!mounted) return;

    if (success && auth.currentUser != null) {
      final hasShop = await shopProvider.checkShopSetup(auth.currentUser!.id);
      if (!mounted) return;
      if (hasShop) {
        context.go('/dashboard');
      } else {
        context.go('/shop-setup');
      }
    } else if (auth.errorMessage != null) {
      AppErrorHandler.showErrorSnackBar(context, auth.errorMessage!);
    }
  }

  Future<void> _handleSendOtp() async {
    final rawPhone = _phoneController.text.trim();
    if (rawPhone.length < 10) {
      AppErrorHandler.showErrorSnackBar(context, 'Please enter a valid 10-digit mobile number');
      return;
    }

    final auth = context.read<OwnerAuthProvider>();
    final ok = await auth.sendPhoneOtp(_fullPhoneNumber);
    if (!mounted) return;

    if (ok) {
      setState(() => _otpSent = true);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('OTP sent to $_fullPhoneNumber'),
          backgroundColor: AppColors.success,
        ),
      );
    } else if (auth.errorMessage != null) {
      AppErrorHandler.showErrorSnackBar(context, auth.errorMessage!);
    }
  }

  Future<void> _handleVerifyOtp() async {
    final otp = _otpController.text.trim();
    if (otp.length < 4) {
      AppErrorHandler.showErrorSnackBar(context, 'Please enter the verification code');
      return;
    }

    final auth = context.read<OwnerAuthProvider>();
    final shopProvider = context.read<ShopProvider>();

    final success = await auth.verifyPhoneOtp(_fullPhoneNumber, otp);
    if (!mounted) return;

    if (success && auth.currentUser != null) {
      final hasShop = await shopProvider.checkShopSetup(auth.currentUser!.id);
      if (!mounted) return;
      if (hasShop) {
        context.go('/dashboard');
      } else {
        context.go('/shop-setup');
      }
    } else if (auth.errorMessage != null) {
      AppErrorHandler.showErrorSnackBar(context, auth.errorMessage!);
    }
  }

  void _showForgotPasswordDialog() {
    final resetPhoneController = TextEditingController(text: _phoneController.text);
    final resetOtpController = TextEditingController();
    final newPasswordController = TextEditingController();
    bool isCodeSent = false;
    String? localCode;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Padding(
              padding: EdgeInsets.only(
                left: 24,
                right: 24,
                top: 24,
                bottom: MediaQuery.of(context).viewInsets.bottom + 24,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Reset Password',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close, color: AppColors.textSecondary),
                        onPressed: () => Navigator.pop(ctx),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    !isCodeSent
                        ? 'Enter your registered mobile number to receive a verification code.'
                        : 'Enter the 6-digit verification code and set your new password.',
                    style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                  ),
                  const SizedBox(height: 16),
                  if (!isCodeSent) ...[
                    CustomTextField(
                      controller: resetPhoneController,
                      label: 'Registered Mobile Number',
                      hint: '98450 12345',
                      prefixIcon: Icons.phone_android_rounded,
                      keyboardType: TextInputType.phone,
                    ),
                    const SizedBox(height: 16),
                    CustomButton(
                      text: 'Send Verification Code',
                      onPressed: () {
                        final raw = resetPhoneController.text.trim();
                        if (raw.length < 10) {
                          AppErrorHandler.showErrorSnackBar(ctx, 'Enter valid 10-digit number');
                          return;
                        }
                        setModalState(() {
                          isCodeSent = true;
                          localCode = '123456';
                        });
                      },
                    ),
                  ] else ...[
                    if (localCode != null)
                      Container(
                        padding: const EdgeInsets.all(10),
                        margin: const EdgeInsets.only(bottom: 12),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text(
                          'Reset Code: $localCode',
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: AppColors.primary,
                          ),
                        ),
                      ),
                    CustomTextField(
                      controller: resetOtpController,
                      label: '6-Digit Verification Code',
                      hint: '123456',
                      prefixIcon: Icons.key_rounded,
                      keyboardType: TextInputType.number,
                    ),
                    const SizedBox(height: 12),
                    CustomTextField(
                      controller: newPasswordController,
                      label: 'New Password / PIN',
                      hint: 'Min. 6 characters',
                      prefixIcon: Icons.lock_outline_rounded,
                      obscureText: true,
                    ),
                    const SizedBox(height: 16),
                    CustomButton(
                      text: 'Update Password',
                      onPressed: () {
                        if (resetOtpController.text.trim().length < 4) {
                          AppErrorHandler.showErrorSnackBar(ctx, 'Enter valid code');
                          return;
                        }
                        if (newPasswordController.text.trim().length < 6) {
                          AppErrorHandler.showErrorSnackBar(ctx, 'Password must be at least 6 characters');
                          return;
                        }
                        Navigator.pop(ctx);
                        _passwordController.text = newPasswordController.text;
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Password updated successfully! Please sign in.'),
                            backgroundColor: AppColors.success,
                          ),
                        );
                      },
                    ),
                  ],
                ],
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<OwnerAuthProvider>();

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 28),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 12),
                Center(
                  child: Container(
                    width: 72,
                    height: 72,
                    decoration: BoxDecoration(
                      color: AppColors.primary,
                      borderRadius: BorderRadius.circular(22),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.primary.withValues(alpha: 0.35),
                          blurRadius: 18,
                          offset: const Offset(0, 6),
                        ),
                      ],
                    ),
                    child: const Icon(Icons.storefront_rounded, size: 38, color: Colors.white),
                  ),
                ),
                const SizedBox(height: 20),
                const Center(
                  child: Text(
                    'Partner Login',
                    style: TextStyle(
                      fontSize: 26,
                      fontWeight: FontWeight.w900,
                      color: AppColors.textPrimary,
                      letterSpacing: -0.5,
                    ),
                  ),
                ),
                const SizedBox(height: 6),
                const Center(
                  child: Text(
                    'Enter your registered mobile number to manage your restaurant',
                    style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
                    textAlign: TextAlign.center,
                  ),
                ),
                const SizedBox(height: 32),

                // Phone Input with Country Code
                const Text(
                  'Owner Mobile Number',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.textSecondary),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: Row(
                        children: [
                          const Text('🇮🇳', style: TextStyle(fontSize: 18)),
                          const SizedBox(width: 6),
                          Text(
                            _countryCode,
                            style: const TextStyle(fontWeight: FontWeight.w700, color: AppColors.textPrimary),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: TextFormField(
                        controller: _phoneController,
                        keyboardType: TextInputType.phone,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textPrimary,
                          letterSpacing: 1.2,
                        ),
                        decoration: InputDecoration(
                          hintText: '98450 12345',
                          hintStyle: const TextStyle(color: AppColors.textMuted, letterSpacing: 1.0),
                          prefixIcon: const Icon(Icons.phone_android_rounded, color: AppColors.textMuted, size: 20),
                          filled: true,
                          fillColor: AppColors.surface,
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(14),
                            borderSide: const BorderSide(color: AppColors.border),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(14),
                            borderSide: const BorderSide(color: AppColors.border),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(14),
                            borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
                          ),
                        ),
                        validator: (v) {
                          if (v == null || v.trim().isEmpty) return 'Please enter mobile number';
                          if (v.trim().length < 10) return 'Enter a valid 10-digit mobile number';
                          return null;
                        },
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),

                // Mode Toggle Tabs: Password vs OTP
                Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: GestureDetector(
                          onTap: () => setState(() => _useOtpMode = false),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 8),
                            decoration: BoxDecoration(
                              color: !_useOtpMode ? AppColors.primary : Colors.transparent,
                              borderRadius: BorderRadius.circular(9),
                            ),
                            alignment: Alignment.center,
                            child: Text(
                              'Password / PIN',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                color: !_useOtpMode ? Colors.white : AppColors.textSecondary,
                              ),
                            ),
                          ),
                        ),
                      ),
                      Expanded(
                        child: GestureDetector(
                          onTap: () => setState(() => _useOtpMode = true),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 8),
                            decoration: BoxDecoration(
                              color: _useOtpMode ? AppColors.primary : Colors.transparent,
                              borderRadius: BorderRadius.circular(9),
                            ),
                            alignment: Alignment.center,
                            child: Text(
                              'Instant SMS OTP',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                color: _useOtpMode ? Colors.white : AppColors.textSecondary,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                // Password Mode Input
                if (!_useOtpMode) ...[
                  CustomTextField(
                    controller: _passwordController,
                    label: 'Owner Security Password / PIN',
                    hint: '••••••••',
                    prefixIcon: Icons.lock_outline_rounded,
                    obscureText: _obscurePassword,
                    suffixIcon: IconButton(
                      icon: Icon(
                        _obscurePassword ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                        color: AppColors.textMuted,
                        size: 20,
                      ),
                      onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                    ),
                    validator: (v) {
                      if (v == null || v.isEmpty) return 'Please enter your password';
                      if (v.length < 6) return 'Password must be at least 6 characters';
                      return null;
                    },
                  ),
                  Align(
                    alignment: Alignment.centerRight,
                    child: TextButton(
                      onPressed: _showForgotPasswordDialog,
                      style: TextButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 8),
                        visualDensity: VisualDensity.compact,
                      ),
                      child: const Text(
                        'Forgot Password?',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: AppColors.primary,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  CustomButton(
                    text: 'Sign In to Dashboard',
                    isLoading: auth.isLoading,
                    onPressed: _handlePasswordLogin,
                  ),
                ] else ...[
                  // OTP Mode Inputs
                  if (!_otpSent) ...[
                    CustomButton(
                      text: 'Send SMS OTP Code',
                      isLoading: auth.isLoading,
                      onPressed: _handleSendOtp,
                    ),
                  ] else ...[
                    CustomTextField(
                      controller: _otpController,
                      label: 'Enter 6-Digit SMS Code',
                      hint: '123456',
                      prefixIcon: Icons.mark_email_read_outlined,
                      keyboardType: TextInputType.number,
                      validator: (v) {
                        if (v == null || v.trim().isEmpty) return 'Enter the OTP code received';
                        return null;
                      },
                    ),
                    const SizedBox(height: 20),
                    CustomButton(
                      text: 'Verify OTP & Enter Dashboard',
                      isLoading: auth.isLoading,
                      onPressed: _handleVerifyOtp,
                    ),
                    const SizedBox(height: 12),
                    Center(
                      child: TextButton(
                        onPressed: _handleSendOtp,
                        child: const Text('Resend OTP Code', style: TextStyle(color: AppColors.primary, fontSize: 13)),
                      ),
                    ),
                  ],
                ],

                const SizedBox(height: 28),

                // Register Link
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text(
                      "New restaurant partner? ",
                      style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
                    ),
                    GestureDetector(
                      onTap: () => context.go('/register'),
                      child: const Text(
                        'Register Restaurant',
                        style: TextStyle(
                          color: AppColors.primary,
                          fontWeight: FontWeight.w800,
                          fontSize: 13,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
