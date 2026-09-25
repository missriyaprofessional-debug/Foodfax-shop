import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/constants.dart';
import '../theme/app_colors.dart';
import '../widgets/custom_button.dart';

class OwnerOnboardingScreen extends StatefulWidget {
  const OwnerOnboardingScreen({super.key});

  @override
  State<OwnerOnboardingScreen> createState() => _OwnerOnboardingScreenState();
}

class _OwnerOnboardingScreenState extends State<OwnerOnboardingScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  void _markOnboardingComplete() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool(AppConstants.prefHasOnboarded, true);
    } catch (_) {}
  }

  void _goToLogin() {
    _markOnboardingComplete();
    context.go('/login');
  }

  void _goToRegister() {
    _markOnboardingComplete();
    context.go('/register');
  }

  final List<Map<String, dynamic>> _slides = [
    {
      'icon': Icons.notifications_active_rounded,
      'title': 'Realtime Live Orders',
      'desc': 'Receive incoming orders with sound alarms, kitchen tickets, and live customer updates.',
    },
    {
      'icon': Icons.bolt_rounded,
      'title': 'Rush Mode & Menu Control',
      'desc': 'Toggle rush hour delay buffers, manage menu items, prices, and stock with a single tap.',
    },
    {
      'icon': Icons.qr_code_2_rounded,
      'title': 'Direct UPI & Counter QR',
      'desc': 'Print your FoodFax shop QR code for table orders and accept zero-commission instant UPI payments.',
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          child: Column(
            children: [
              // Top Bar with Skip
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: AppColors.primary,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(Icons.restaurant, color: Colors.white, size: 18),
                      ),
                      const SizedBox(width: 8),
                      const Text(
                        'FoodFax Partner',
                        style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
                      ),
                    ],
                  ),
                  TextButton(
                    onPressed: _goToLogin,
                    child: const Text('Login', style: TextStyle(color: AppColors.primary)),
                  ),
                ],
              ),
              const Spacer(),

              // Slides
              SizedBox(
                height: 340,
                child: PageView.builder(
                  controller: _pageController,
                  itemCount: _slides.length,
                  onPageChanged: (index) => setState(() => _currentPage = index),
                  itemBuilder: (context, index) {
                    final slide = _slides[index];
                    return Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          width: 110,
                          height: 110,
                          decoration: BoxDecoration(
                            color: AppColors.surface,
                            shape: BoxShape.circle,
                            border: Border.all(color: AppColors.primary.withOpacity(0.3), width: 2),
                          ),
                          child: Icon(slide['icon'] as IconData, size: 54, color: AppColors.primary),
                        ),
                        const SizedBox(height: 32),
                        Text(
                          slide['title'] as String,
                          style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 12),
                        Text(
                          slide['desc'] as String,
                          style: const TextStyle(fontSize: 14, color: AppColors.textSecondary, height: 1.5),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    );
                  },
                ),
              ),

              // Indicators
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(
                  _slides.length,
                  (index) => AnimatedContainer(
                    duration: const Duration(milliseconds: 300),
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    width: _currentPage == index ? 24 : 8,
                    height: 8,
                    decoration: BoxDecoration(
                      color: _currentPage == index ? AppColors.primary : AppColors.cardBorder,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                ),
              ),
              const Spacer(),

              // Action Buttons
              CustomButton(
                text: 'Register My Restaurant',
                onPressed: _goToRegister,
              ),
              const SizedBox(height: 12),
              CustomButton(
                text: 'Sign In to Existing Shop',
                isOutlined: true,
                onPressed: _goToLogin,
              ),
              const SizedBox(height: 12),
            ],
          ),
        ),
      ),
    );
  }
}
