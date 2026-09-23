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

class FoodFaxOwnerApp extends StatelessWidget {
  const FoodFaxOwnerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => OwnerAuthProvider()),
        ChangeNotifierProvider(create: (_) => ShopProvider()),
        ChangeNotifierProvider(create: (_) => OrderProvider()),
        ChangeNotifierProvider(create: (_) => MenuProvider()),
      ],
      child: Builder(
        builder: (context) {
          final authProvider = context.watch<OwnerAuthProvider>();
          final shopProvider = context.watch<ShopProvider>();
          final router = createRouter(authProvider, shopProvider);

          return MaterialApp.router(
            title: AppConstants.appName,
            debugShowCheckedModeBanner: false,
            theme: AppTheme.darkTheme,
            routerConfig: router,
          );
        },
      ),
    );
  }
}
