import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../providers/shop_provider.dart';
import '../screens/splash_screen.dart';
import '../screens/onboarding_screen.dart';
import '../screens/login_screen.dart';
import '../screens/register_screen.dart';
import '../screens/shop_setup_screen.dart';
import '../screens/dashboard_screen.dart';
import '../screens/orders_screen.dart';
import '../screens/order_details_screen.dart';
import '../screens/menu_screen.dart';
import '../screens/add_edit_menu_item_screen.dart';
import '../screens/shop_profile_screen.dart';
import '../screens/shop_settings_screen.dart';
import '../screens/shop_qr_screen.dart';
import '../screens/sales_history_screen.dart';
import '../screens/notifications_screen.dart';
import '../screens/profile_screen.dart';

GoRouter createRouter(OwnerAuthProvider authProvider, ShopProvider shopProvider) {
  return GoRouter(
    initialLocation: '/splash',
    refreshListenable: Listenable.merge([authProvider, shopProvider]),
    redirect: (BuildContext context, GoRouterState state) {
      final isAuth = authProvider.isAuthenticated;
      final isCheckingAuth = authProvider.status == AuthStatus.initial;
      final location = state.uri.toString();

      if (isCheckingAuth) return '/splash';

      final isAuthRoute = location == '/login' ||
          location == '/register' ||
          location == '/onboarding' ||
          location == '/splash';

      // 1. If not authenticated, ensure they can only visit login/register/onboarding
      if (!isAuth) {
        return isAuthRoute ? null : '/login';
      }

      // 2. If authenticated, check shop setup
      final hasShop = shopProvider.hasCompletedShopSetup;
      if (!hasShop) {
        // Must complete shop setup first
        return location == '/shop-setup' ? null : '/shop-setup';
      }

      // 3. Authenticated and has shop: prevent visiting login/register/onboarding/shop-setup
      if (isAuthRoute || location == '/shop-setup') {
        return '/dashboard';
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/splash',
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: '/onboarding',
        builder: (context, state) => const OwnerOnboardingScreen(),
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) => const OwnerLoginScreen(),
      ),
      GoRoute(
        path: '/register',
        builder: (context, state) => const OwnerRegisterScreen(),
      ),
      GoRoute(
        path: '/shop-setup',
        builder: (context, state) => const ShopSetupScreen(),
      ),
      GoRoute(
        path: '/dashboard',
        builder: (context, state) => const OwnerDashboardScreen(),
      ),
      GoRoute(
        path: '/orders',
        builder: (context, state) => const OrdersScreen(),
      ),
      GoRoute(
        path: '/orders/:id',
        builder: (context, state) {
          final orderId = state.pathParameters['id']!;
          return OrderDetailsScreen(orderId: orderId);
        },
      ),
      GoRoute(
        path: '/menu',
        builder: (context, state) => const MenuScreen(),
      ),
      GoRoute(
        path: '/menu/add',
        builder: (context, state) => const AddEditMenuItemScreen(),
      ),
      GoRoute(
        path: '/menu/edit/:id',
        builder: (context, state) {
          final itemId = state.pathParameters['id']!;
          return AddEditMenuItemScreen(itemId: itemId);
        },
      ),
      GoRoute(
        path: '/shop-profile',
        builder: (context, state) => const ShopProfileScreen(),
      ),
      GoRoute(
        path: '/shop-settings',
        builder: (context, state) => const ShopSettingsScreen(),
      ),
      GoRoute(
        path: '/shop-qr',
        builder: (context, state) => const ShopQrScreen(),
      ),
      GoRoute(
        path: '/sales',
        builder: (context, state) => const SalesHistoryScreen(),
      ),
      GoRoute(
        path: '/notifications',
        builder: (context, state) => const NotificationsScreen(),
      ),
      GoRoute(
        path: '/profile',
        builder: (context, state) => const OwnerProfileScreen(),
      ),
    ],
  );
}
