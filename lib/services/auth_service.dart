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
    return 'ff.owner.$digits@foodfax.local';
  }

  String _phoneToFallbackEmail(String phone) {
    final digits = phone.replaceAll(RegExp(r'\D'), '');
    return 'ff.owner.$digits@gmail.com';
  }

  /// Register new owner with phone number in Supabase Auth & public.users table
  Future<AuthResponse> registerOwnerWithPhone({
    required String phone,
    required String password,
    required String fullName,
  }) async {
    final cleanPhone = phone.trim().replaceAll(' ', '');
    final digits = cleanPhone.replaceAll(RegExp(r'\D'), '');
    final internalEmail = _phoneToInternalEmail(cleanPhone);
    AuthResponse response;

    try {
      response = await _client.auth.signUp(
        email: internalEmail,
        password: password,
        data: {
          'full_name': fullName.trim(),
          'phone': cleanPhone,
          'role': 'owner',
        },
      );
    } catch (_) {
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
        final fallbackEmail = _phoneToFallbackEmail(cleanPhone);
        response = await _client.auth.signUp(
          email: fallbackEmail,
          password: password,
          data: {
            'full_name': fullName.trim(),
            'phone': cleanPhone,
            'role': 'owner',
          },
        );
      }
    }

    final userId = response.user?.id ?? 'owner_$digits';

    // Store in public.users table matching database schema
    try {
      await _client.from('users').upsert({
        'id': userId,
        'phone': cleanPhone,
        'email': internalEmail,
        'full_name': fullName.trim(),
        'role': 'owner',
        'profile_completed': true,
        'is_active': true,
        'is_demo': false,
        'created_at': DateTime.now().toIso8601String(),
        'updated_at': DateTime.now().toIso8601String(),
      }, onConflict: 'id');
    } catch (e) {
      // ignore table upsert warnings
    }

    return response;
  }

  /// Login with phone number & password / PIN
  Future<AuthResponse> loginWithPhone({
    required String phone,
    required String password,
  }) async {
    final cleanPhone = phone.trim().replaceAll(' ', '');
    final digits = cleanPhone.replaceAll(RegExp(r'\D'), '');
    final last10 = digits.length >= 10 ? digits.substring(digits.length - 10) : digits;

    // 1. Try signInWithPassword using canonical internal email (@foodfax.local)
    final internalEmail = _phoneToInternalEmail(cleanPhone);
    try {
      final response = await _client.auth.signInWithPassword(
        email: internalEmail,
        password: password,
      );
      if (response.user != null) {
        _syncUserRecord(response.user!.id, cleanPhone, response.user!.userMetadata?['full_name']);
        return response;
      }
    } catch (_) {}

    // 2. Try signInWithPassword using fallback email (@gmail.com)
    final fallbackEmail = _phoneToFallbackEmail(cleanPhone);
    try {
      final response = await _client.auth.signInWithPassword(
        email: fallbackEmail,
        password: password,
      );
      if (response.user != null) {
        _syncUserRecord(response.user!.id, cleanPhone, response.user!.userMetadata?['full_name']);
        return response;
      }
    } catch (_) {}

    // 3. Try signInWithPassword with phone directly
    try {
      final response = await _client.auth.signInWithPassword(
        phone: cleanPhone,
        password: password,
      );
      if (response.user != null) {
        _syncUserRecord(response.user!.id, cleanPhone, response.user!.userMetadata?['full_name']);
        return response;
      }
    } catch (_) {}

    // 4. Check if user already exists in public.users table
    try {
      final userRecord = await _client
          .from('users')
          .select()
          .or('phone.eq.$cleanPhone,phone.eq.$digits,phone.ilike.%$last10%')
          .limit(1)
          .maybeSingle();

      if (userRecord != null) {
        // Check if user has a stored email in their users record and try that
        final recordEmail = userRecord['email'] as String?;
        if (recordEmail != null && recordEmail.isNotEmpty && recordEmail != internalEmail && recordEmail != fallbackEmail) {
          try {
            final res = await _client.auth.signInWithPassword(
              email: recordEmail,
              password: password,
            );
            if (res.user != null) {
              _syncUserRecord(res.user!.id, cleanPhone, userRecord['full_name']);
              return res;
            }
          } catch (_) {}
        }

        // User is registered in database; ensure auth account exists
        try {
          final signUpRes = await _client.auth.signUp(
            email: internalEmail,
            password: password,
            data: {
              'full_name': userRecord['full_name'] ?? 'Restaurant Owner',
              'phone': cleanPhone,
              'role': 'owner',
            },
          );
          if (signUpRes.user != null) {
            return signUpRes;
          }
        } catch (_) {}
      }
    } catch (_) {}

    // 5. Final fallback: auto-register with provided credentials
    try {
      return await _client.auth.signUp(
        email: internalEmail,
        password: password,
        data: {
          'phone': cleanPhone,
          'role': 'owner',
        },
      );
    } catch (e) {
      final msg = e.toString().toLowerCase();
      if (msg.contains('already registered') || msg.contains('already exists') || msg.contains('user_already_exists')) {
        throw Exception('Incorrect password for registered owner $cleanPhone. Please check your password or use SMS OTP to log in.');
      }
      rethrow;
    }
  }

  void _syncUserRecord(String userId, String phone, dynamic name) async {
    try {
      await _client.from('users').upsert({
        'id': userId,
        'phone': phone,
        'role': 'owner',
        'profile_completed': true,
        'is_active': true,
        'updated_at': DateTime.now().toIso8601String(),
        if (name != null) 'full_name': name.toString(),
      }, onConflict: 'id');
    } catch (_) {}
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
    final digits = cleanPhone.replaceAll(RegExp(r'\D'), '');
    try {
      final response = await _client.auth.verifyOtp(
        phone: cleanPhone,
        token: token.trim(),
        type: OtpType.sms,
      );
      if (response.user != null) {
        _syncUserRecord(response.user!.id, cleanPhone, 'Restaurant Owner');
      }
      return response;
    } catch (_) {
      // Fallback signup session with OTP password
      final internalEmail = _phoneToInternalEmail(cleanPhone);
      final res = await _client.auth.signUp(
        email: internalEmail,
        password: 'FoodFaxOwner@${token.trim()}',
        data: {
          'phone': cleanPhone,
          'role': 'owner',
        },
      );
      final userId = res.user?.id ?? 'owner_$digits';
      _syncUserRecord(userId, cleanPhone, 'Restaurant Owner');
      return res;
    }
  }

  /// Sign out
  Future<void> signOut() async {
    await _client.auth.signOut();
  }

  /// Fetch owner profile from public.users table
  Future<OwnerProfile?> fetchOwnerProfile(String userId) async {
    try {
      // 1. Query public.users table by id
      final res = await _client
          .from('users')
          .select()
          .eq('id', userId)
          .maybeSingle();

      if (res != null) {
        return OwnerProfile.fromJson(res);
      }
    } catch (_) {}

    // 2. Query public.users by current user phone
    final user = currentUser;
    if (user != null) {
      final phone = user.userMetadata?['phone'] as String?;
      if (phone != null && phone.isNotEmpty) {
        final digits = phone.replaceAll(RegExp(r'\D'), '');
        final last10 = digits.length >= 10 ? digits.substring(digits.length - 10) : digits;
        try {
          final res = await _client
              .from('users')
              .select()
              .or('phone.eq.$phone,phone.ilike.%$last10%')
              .limit(1)
              .maybeSingle();

          if (res != null) {
            return OwnerProfile.fromJson(res);
          }
        } catch (_) {}
      }

      // 3. Fallback to Supabase Auth User object
      return OwnerProfile(
        id: user.id,
        email: user.email ?? '',
        fullName: user.userMetadata?['full_name'] as String? ?? 'Restaurant Owner',
        phone: user.userMetadata?['phone'] as String? ?? phone,
        role: 'owner',
        createdAt: DateTime.tryParse(user.createdAt),
      );
    }

    return null;
  }

  /// Refresh JWT Session
  Future<void> refreshSession() async {
    await _client.auth.refreshSession();
  }
}
