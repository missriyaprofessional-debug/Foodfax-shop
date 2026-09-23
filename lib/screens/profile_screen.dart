import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../providers/shop_provider.dart';
import '../theme/app_colors.dart';

class OwnerProfileScreen extends StatelessWidget {
  const OwnerProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<OwnerAuthProvider>();
    final shop = context.watch<ShopProvider>().currentShop;
    final profile = auth.currentProfile;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Partner Account & Shop'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Owner Info Card
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.cardBorder),
            ),
            child: Row(
              children: [
                Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    color: AppColors.primary,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Center(
                    child: Text(
                      (profile?.fullName != null && profile!.fullName!.isNotEmpty)
                          ? profile.fullName![0].toUpperCase()
                          : 'O',
                      style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: Colors.white),
                    ),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        profile?.fullName ?? 'Restaurant Owner',
                        style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 17),
                      ),
                      Text(
                        profile?.email ?? '',
                        style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                      ),
                      const SizedBox(height: 4),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          shop?.name ?? 'Verified Partner',
                          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.primary),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Menu Options
          _buildNavTile(
            context,
            icon: Icons.store_outlined,
            title: 'Shop Profile & Details',
            subtitle: 'Address, timings, description & UPI ID',
            onTap: () => context.push('/shop-profile'),
          ),
          _buildNavTile(
            context,
            icon: Icons.tune_outlined,
            title: 'Operations & Settings',
            subtitle: 'Rush mode, order types, sound alarms',
            onTap: () => context.push('/shop-settings'),
          ),
          _buildNavTile(
            context,
            icon: Icons.qr_code_2,
            title: 'Counter & Table QR Code',
            subtitle: 'Print standees for direct ordering',
            onTap: () => context.push('/shop-qr'),
          ),
          _buildNavTile(
            context,
            icon: Icons.bar_chart_rounded,
            title: 'Sales & Revenue Analytics',
            subtitle: 'Order reports, payments, settlements',
            onTap: () => context.push('/sales'),
          ),
          _buildNavTile(
            context,
            icon: Icons.notifications_active_outlined,
            title: 'Order Alert History',
            subtitle: 'Audited log of kitchen notifications',
            onTap: () => context.push('/notifications'),
          ),
          const SizedBox(height: 24),

          // Logout Button
          Container(
            decoration: BoxDecoration(
              color: Colors.red.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.red.withOpacity(0.2)),
            ),
            child: ListTile(
              leading: const Icon(Icons.logout, color: Colors.redAccent),
              title: const Text('Log Out from Shop', style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.w700)),
              subtitle: const Text('Switch owner account or end session', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
              onTap: () => _confirmLogout(context, auth),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNavTile(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.cardBorder),
      ),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: AppColors.primary.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: AppColors.primary, size: 20),
        ),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
        subtitle: Text(subtitle, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
        trailing: const Icon(Icons.chevron_right, size: 18, color: AppColors.textMuted),
        onTap: onTap,
      ),
    );
  }

  void _confirmLogout(BuildContext context, OwnerAuthProvider auth) {
    showDialog(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          backgroundColor: AppColors.surface,
          title: const Text('Log Out?', style: TextStyle(fontWeight: FontWeight.w800)),
          content: const Text('Are you sure you want to log out from FoodFax Owner App?'),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
            ElevatedButton(
              onPressed: () async {
                Navigator.pop(ctx);
                await auth.logout();
                if (context.mounted) {
                  context.go('/login');
                }
              },
              style: ElevatedButton.styleFrom(backgroundColor: Colors.red.shade700),
              child: const Text('Log Out'),
            ),
          ],
        );
      },
    );
  }
}
