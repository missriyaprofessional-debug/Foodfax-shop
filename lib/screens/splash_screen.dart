import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/constants.dart';
import '../providers/auth_provider.dart';
import '../providers/shop_provider.dart';
import '../theme/app_colors.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _checkInitialState();
  }

  Future<void> _checkInitialState() async {
    final prefs = await SharedPreferences.getInstance();
    final hasOnboarded = prefs.getBool(AppConstants.prefHasOnboarded) ?? false;

    final auth = context.read<OwnerAuthProvider>();
    final shopProvider = context.read<ShopProvider>();

    // Allow initial auth state check to complete gracefully
    int elapsed = 0;
    while (auth.status == AuthStatus.initial && elapsed < 1200) {
      await Future.delayed(const Duration(milliseconds: 100));
      elapsed += 100;
      if (!mounted) return;
    }

    if (!mounted) return;

    final userId = auth.currentProfile?.id ?? auth.currentUser?.id;
    if (auth.isAuthenticated && userId != null && userId.isNotEmpty) {
      final hasShop = await shopProvider.checkShopSetup(userId);
      if (!mounted) return;
      if (hasShop) {
        context.go('/dashboard');
      } else {
        context.go('/shop-setup');
      }
    } else {
      // If user has already seen onboarding or has opened the app before, go straight to login
      if (hasOnboarded) {
        context.go('/login');
      } else {
        context.go('/onboarding');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 90,
              height: 90,
              decoration: BoxDecoration(
                color: AppColors.primary,
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primary.withOpacity(0.4),
                    blurRadius: 24,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: const Icon(Icons.storefront_rounded, size: 48, color: Colors.white),
            ),
            const SizedBox(height: 24),
            const Text(
              'FoodFax',
              style: TextStyle(
                fontSize: 32,
                fontWeight: FontWeight.w900,
                color: AppColors.textPrimary,
                letterSpacing: -0.5,
              ),
            ),
            const SizedBox(height: 6),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              decoration: BoxDecoration(
                color: AppColors.primary.withOpacity(0.15),
                borderRadius: BorderRadius.circular(16),
              ),
              child: const Text(
                'PARTNER & OWNER APP',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  color: AppColors.primary,
                  letterSpacing: 1.2,
                ),
              ),
            ),
            const SizedBox(height: 48),
            const SizedBox(
              width: 24,
              height: 24,
              child: CircularProgressIndicator(strokeWidth: 2.5, color: AppColors.primary),
            ),
          ],
        ),
      ),
    );
  }
}
