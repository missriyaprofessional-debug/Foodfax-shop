import 'package:supabase_flutter/supabase_flutter.dart';
import '../core/supabase_client.dart';
import '../models/owner_profile.dart';

class AuthService {
  final SupabaseClient _client = SupabaseService.client;

  Stream<AuthState> get authStateChanges => _client.auth.onAuthStateChange;
  User? get currentUser => _client.auth.currentUser;
  Session? get currentSession => _client.auth.currentSession;
  bool get isAuthenticated => currentUser != null;

  /// Register new owner
  Future<AuthResponse> registerOwner({
    required String email,
    required String password,
    required String fullName,
    String? phone,
  }) async {
    final response = await _client.auth.signUp(
      email: email.trim(),
      password: password,
      data: {
        'full_name': fullName.trim(),
        'phone': phone?.trim(),
        'role': 'owner',
      },
    );

    if (response.user != null) {
      // Upsert into public.profiles / owner_profiles table
      try {
        await _client.from('profiles').upsert({
          'id': response.user!.id,
          'email': email.trim(),
          'full_name': fullName.trim(),
          'phone': phone?.trim(),
          'role': 'owner',
          'updated_at': DateTime.now().toIso8601String(),
        });
      } catch (_) {
        // Fallback if table name is owner_profiles
        try {
          await _client.from('owner_profiles').upsert({
            'id': response.user!.id,
            'email': email.trim(),
            'name': fullName.trim(),
            'phone': phone?.trim(),
            'role': 'owner',
          });
        } catch (_) {}
      }
    }

    return response;
  }

  /// Login with email & password
  Future<AuthResponse> login({
    required String email,
    required String password,
  }) async {
    final response = await _client.auth.signInWithPassword(
      email: email.trim(),
      password: password,
    );
    return response;
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

    // Default profile from Auth user metadata
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
