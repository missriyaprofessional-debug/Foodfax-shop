import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'core/supabase_client.dart';
import 'core/constants.dart';
import 'providers/auth_provider.dart';
import 'providers/shop_provider.dart';
import 'providers/order_provider.dart';
import 'providers/menu_provider.dart';
import 'navigation/app_router.dart';
import 'theme/app_theme.dart';
import 'services/audio_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Supabase SDK with PKCE Auth & Realtime
  try {
    await SupabaseService.initialize(
      url: AppConstants.supabaseUrl,
      anonKey: AppConstants.supabaseAnonKey,
    );
  } catch (e) {
    debugPrint('Supabase init warning: $e');
  }

  // Initialize Audio Notifications
  await AudioService().init();

  runApp(const FoodFaxOwnerApp());
}

class FoodFaxOwnerApp extends StatefulWidget {
  const FoodFaxOwnerApp({super.key});

  @override
  State<FoodFaxOwnerApp> createState() => _FoodFaxOwnerAppState();
}

class _FoodFaxOwnerAppState extends State<FoodFaxOwnerApp> {
  late final OwnerAuthProvider _authProvider;
  late final ShopProvider _shopProvider;
  late final OrderProvider _orderProvider;
  late final MenuProvider _menuProvider;
  late final GoRouter _router;

  @override
  void initState() {
    super.initState();
    _authProvider = OwnerAuthProvider();
    _shopProvider = ShopProvider();
    _orderProvider = OrderProvider();
    _menuProvider = MenuProvider();
    // Router is initialized once and relies on GoRouter's refreshListenable
    _router = createRouter(_authProvider, _shopProvider);
  }

  @override
  void dispose() {
    _router.dispose();
    _authProvider.dispose();
    _shopProvider.dispose();
    _orderProvider.dispose();
    _menuProvider.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider.value(value: _authProvider),
        ChangeNotifierProvider.value(value: _shopProvider),
        ChangeNotifierProvider.value(value: _orderProvider),
        ChangeNotifierProvider.value(value: _menuProvider),
      ],
      child: MaterialApp.router(
        title: AppConstants.appName,
        debugShowCheckedModeBanner: false,
        theme: AppTheme.darkTheme,
        routerConfig: _router,
      ),
    );
  }
}
