import React, { useState } from 'react';
import { X, FileCode, Check, Copy } from 'lucide-react';

interface FlutterCodeViewerModalProps {
  onClose: () => void;
}

const FLUTTER_FILES: { path: string; name: string; category: string; code: string }[] = [
  {
    path: 'lib/main.dart',
    name: 'main.dart',
    category: 'Entry Point',
    code: `import 'package:flutter/material.dart';
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

  // Initialize Supabase with PKCE Auth & Realtime
  await SupabaseService.initialize(
    url: AppConstants.supabaseUrl,
    anonKey: AppConstants.supabaseAnonKey,
  );

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
}`,
  },
  {
    path: 'lib/navigation/app_router.dart',
    name: 'app_router.dart',
    category: 'Navigation',
    code: `import 'package:flutter/material.dart';
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
    initialLocation: '/',
    refreshListenable: Listenable.merge([authProvider, shopProvider]),
    redirect: (context, state) {
      final isAuth = authProvider.isAuthenticated;
      final hasSetup = shopProvider.hasCompletedShopSetup;
      final path = state.uri.path;

      final isPublicRoute = path == '/' || path == '/onboarding' || path == '/login' || path == '/register';

      if (!isAuth && !isPublicRoute) {
        return '/login';
      }

      if (isAuth && !hasSetup && path != '/shop-setup') {
        return '/shop-setup';
      }

      if (isAuth && hasSetup && isPublicRoute) {
        return '/dashboard';
      }

      return null;
    },
    routes: [
      GoRoute(path: '/', builder: (context, state) => const SplashScreen()),
      GoRoute(path: '/onboarding', builder: (context, state) => const OnboardingScreen()),
      GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
      GoRoute(path: '/register', builder: (context, state) => const RegisterScreen()),
      GoRoute(path: '/shop-setup', builder: (context, state) => const ShopSetupScreen()),
      GoRoute(path: '/dashboard', builder: (context, state) => const OwnerDashboardScreen()),
      GoRoute(path: '/orders', builder: (context, state) => const OrdersScreen()),
      GoRoute(path: '/orders/:id', builder: (context, state) => OrderDetailsScreen(orderId: state.pathParameters['id']!)),
      GoRoute(path: '/menu', builder: (context, state) => const MenuScreen()),
      GoRoute(path: '/menu/add', builder: (context, state) => const AddEditMenuItemScreen()),
      GoRoute(path: '/menu/edit/:id', builder: (context, state) => AddEditMenuItemScreen(itemId: state.pathParameters['id'])),
      GoRoute(path: '/shop-profile', builder: (context, state) => const ShopProfileScreen()),
      GoRoute(path: '/shop-settings', builder: (context, state) => const ShopSettingsScreen()),
      GoRoute(path: '/shop-qr', builder: (context, state) => const ShopQrScreen()),
      GoRoute(path: '/sales', builder: (context, state) => const SalesHistoryScreen()),
      GoRoute(path: '/notifications', builder: (context, state) => const NotificationsScreen()),
      GoRoute(path: '/profile', builder: (context, state) => const OwnerProfileScreen()),
    ],
  );
}`,
  },
  {
    path: 'lib/services/order_service.dart',
    name: 'order_service.dart',
    category: 'Services',
    code: `import 'package:supabase_flutter/supabase_flutter.dart';
import '../core/supabase_client.dart';
import '../models/order.dart';

class OrderService {
  final SupabaseClient _client = SupabaseService.client;

  // Realtime subscription for incoming orders
  RealtimeChannel subscribeToShopOrders(String shopId, void Function(Map<String, dynamic> payload) onEvent) {
    return _client
        .channel('public:orders:shop_id=eq.$shopId')
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: 'orders',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'shop_id',
            value: shopId,
          ),
          callback: (payload) => onEvent(payload.newRecord),
        )
        .subscribe();
  }

  // Update order status (pending -> accepted -> preparing -> ready -> completed)
  Future<void> updateOrderStatus(String orderId, String status, {String? reason}) async {
    await _client.from('orders').update({
      'status': status,
      if (reason != null) 'cancellation_reason': reason,
      'updated_at': DateTime.now().toIso8601String(),
    }).eq('id', orderId);
  }
}`,
  },
  {
    path: 'lib/core/supabase_client.dart',
    name: 'supabase_client.dart',
    category: 'Core',
    code: `import 'package:supabase_flutter/supabase_flutter.dart';

class SupabaseService {
  static late final SupabaseClient client;

  static Future<void> initialize({
    required String url,
    required String anonKey,
  }) async {
    await Supabase.initialize(
      url: url,
      anonKey: anonKey,
      authOptions: const FlutterAuthClientOptions(
        authFlowType: AuthFlowType.pkce,
      ),
    );
    client = Supabase.instance.client;
  }
}`,
  },
  {
    path: 'lib/models/shop.dart',
    name: 'shop.dart',
    category: 'Models',
    code: `class Shop {
  final String id;
  final String ownerId;
  final String name;
  final String? shopType;
  final String? description;
  final String? phone;
  final String? address;
  final String? area;
  final String? city;
  final String? state;
  final String? pincode;
  final double? latitude;
  final double? longitude;
  final String? openingTime;
  final String? closingTime;
  final String? upiId;
  final bool isOpen;
  final bool isRushMode;
  final int rushExtraMinutes;
  final double minimumOrder;
  final bool acceptsTakeaway;
  final bool acceptsDineIn;

  Shop({
    required this.id,
    required this.ownerId,
    required this.name,
    this.shopType,
    this.description,
    this.phone,
    this.address,
    this.area,
    this.city,
    this.state,
    this.pincode,
    this.latitude,
    this.longitude,
    this.openingTime,
    this.closingTime,
    this.upiId,
    this.isOpen = true,
    this.isRushMode = false,
    this.rushExtraMinutes = 15,
    this.minimumOrder = 0.0,
    this.acceptsTakeaway = true,
    this.acceptsDineIn = true,
  });
}`,
  },
];

export const FlutterCodeViewerModal: React.FC<FlutterCodeViewerModalProps> = ({ onClose }) => {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [copied, setCopied] = useState(false);

  const currentFile = FLUTTER_FILES[selectedIdx];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-white">
                FoodFax Flutter Owner App Source Code
              </h3>
              <p className="text-[11px] text-slate-400">
                Production-grade architecture in <code className="text-cyan-400">/lib</code> directory
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center gap-1.5 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy File'}</span>
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body: Sidebar + Code viewer */}
        <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">
          {/* File Explorer Sidebar */}
          <div className="w-full md:w-64 bg-slate-950/70 border-b md:border-b-0 md:border-r border-slate-800 p-3 shrink-0 overflow-y-auto">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2 px-2">
              Flutter Architecture Files
            </p>
            <div className="space-y-1">
              {FLUTTER_FILES.map((file, i) => (
                <button
                  key={file.path}
                  onClick={() => setSelectedIdx(i)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition ${
                    selectedIdx === i
                      ? 'bg-orange-600 text-white font-bold shadow-md shadow-orange-950'
                      : 'text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                  }`}
                >
                  <span className="truncate">{file.name}</span>
                  <span
                    className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-black ${
                      selectedIdx === i ? 'bg-black/30 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {file.category}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Code Viewer */}
          <div className="flex-1 bg-slate-950 overflow-auto p-4 font-mono text-xs text-slate-200 leading-relaxed selection:bg-orange-500 selection:text-white">
            <div className="text-[11px] text-slate-500 mb-3 border-b border-slate-800 pb-2 flex items-center justify-between">
              <span>File: {currentFile.path}</span>
              <span className="text-cyan-400">Dart / Flutter 3.x</span>
            </div>
            <pre className="whitespace-pre overflow-x-auto text-[11px]">{currentFile.code}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};
