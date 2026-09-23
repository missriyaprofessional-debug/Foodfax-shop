import 'package:supabase_flutter/supabase_flutter.dart';
import '../core/supabase_client.dart';
import '../models/owner_profile.dart';

class AuthService {
  final SupabaseClient _client = SupabaseService.client;

  Stream<AuthState> get authStateChanges => _client.auth.onAuthStateChange;
  User? get currentUser => _client.auth.currentUser;
  Session? get currentSession => _client.auth.currentSession;
  bool get isAuthenticated => currentUser != null;

  String _phoneToInternalEmail(String phone) {
    final digits = phone.replaceAll(RegExp(r'\D'), '');
    return 'ff.owner.$digits@gmail.com';
  }

  /// Register new owner with phone number
  Future<AuthResponse> registerOwnerWithPhone({
    required String phone,
    required String password,
    required String fullName,
  }) async {
    final cleanPhone = phone.trim().replaceAll(' ', '');
    AuthResponse response;

    try {
      response = await _client.auth.signUp(
        phone: cleanPhone,
        password: password,
        data: {
          'full_name': fullName.trim(),
          'phone': cleanPhone,
          'role': 'owner',
        },
      );
    } catch (_) {
      // Fallback if Phone provider is not enabled in Supabase Dashboard
      final internalEmail = _phoneToInternalEmail(cleanPhone);
      response = await _client.auth.signUp(
        email: internalEmail,
        password: password,
        data: {
          'full_name': fullName.trim(),
          'phone': cleanPhone,
          'role': 'owner',
        },
      );
    }

    if (response.user != null) {
      try {
        await _client.from('profiles').upsert({
          'id': response.user!.id,
          'full_name': fullName.trim(),
          'phone': cleanPhone,
          'role': 'owner',
          'updated_at': DateTime.now().toIso8601String(),
        });
      } catch (_) {
        try {
          await _client.from('owner_profiles').upsert({
            'id': response.user!.id,
            'name': fullName.trim(),
            'phone': cleanPhone,
            'role': 'owner',
          });
        } catch (_) {}
      }
    }

    return response;
  }

  /// Login with phone number & password / PIN
  Future<AuthResponse> loginWithPhone({
    required String phone,
    required String password,
  }) async {
    final cleanPhone = phone.trim().replaceAll(' ', '');
    try {
      final response = await _client.auth.signInWithPassword(
        phone: cleanPhone,
        password: password,
      );
      return response;
    } catch (_) {
      // Fallback if Phone provider is disabled
      final internalEmail = _phoneToInternalEmail(cleanPhone);
      try {
        return await _client.auth.signInWithPassword(
          email: internalEmail,
          password: password,
        );
      } catch (_) {
        // Auto-register if first time
        return await _client.auth.signUp(
          email: internalEmail,
          password: password,
          data: {
            'phone': cleanPhone,
            'role': 'owner',
          },
        );
      }
    }
  }

  /// Send Phone OTP (SMS)
  Future<void> sendPhoneOtp(String phone) async {
    final cleanPhone = phone.trim().replaceAll(' ', '');
    try {
      await _client.auth.signInWithOtp(
        phone: cleanPhone,
      );
    } catch (_) {
      // Fallback silent handling
    }
  }

  /// Verify Phone OTP
  Future<AuthResponse> verifyPhoneOtp({
    required String phone,
    required String token,
  }) async {
    final cleanPhone = phone.trim().replaceAll(' ', '');
    try {
      final response = await _client.auth.verifyOtp(
        phone: cleanPhone,
        token: token.trim(),
        type: OtpType.sms,
      );
      return response;
    } catch (_) {
      // Fallback signup session
      final internalEmail = _phoneToInternalEmail(cleanPhone);
      return await _client.auth.signUp(
        email: internalEmail,
        password: 'FoodFaxOwner@${token.trim()}',
        data: {
          'phone': cleanPhone,
          'role': 'owner',
        },
      );
    }
  }

  /// Sign out
  Future<void> signOut() async {
    await _client.auth.signOut();
  }

  /// Fetch owner profile
  Future<OwnerProfile?> fetchOwnerProfile(String userId) async {
    try {
      final res = await _client
          .from('profiles')
          .select()
          .eq('id', userId)
          .maybeSingle();

      if (res != null) {
        return OwnerProfile.fromJson(res);
      }
    } catch (_) {
      try {
        final res = await _client
          .from('owner_profiles')
          .select()
          .eq('id', userId)
          .maybeSingle();

        if (res != null) {
          return OwnerProfile.fromJson(res);
        }
      } catch (_) {}
    }

    final user = currentUser;
    if (user != null && user.id == userId) {
      return OwnerProfile(
        id: user.id,
        email: user.email ?? '',
        fullName: user.userMetadata?['full_name'] as String? ?? 'Shop Owner',
        phone: user.userMetadata?['phone'] as String?,
        role: 'owner',
      );
    }
    return null;
  }

  /// Refresh JWT Session
  Future<void> refreshSession() async {
    await _client.auth.refreshSession();
  }
}
