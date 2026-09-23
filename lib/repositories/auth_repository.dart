import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/owner_profile.dart';
import '../services/auth_service.dart';

class AuthRepository {
  final AuthService _authService;

  AuthRepository({AuthService? authService}) : _authService = authService ?? AuthService();

  Stream<AuthState> get authStateChanges => _authService.authStateChanges;
  User? get currentUser => _authService.currentUser;
  bool get isAuthenticated => _authService.isAuthenticated;

  Future<AuthResponse> registerOwner({
    required String email,
    required String password,
    required String fullName,
    String? phone,
  }) {
    return _authService.registerOwner(
      email: email,
      password: password,
      fullName: fullName,
      phone: phone,
    );
  }

  Future<AuthResponse> login({
    required String email,
    required String password,
  }) {
    return _authService.login(email: email, password: password);
  }

  Future<void> signOut() => _authService.signOut();

  Future<OwnerProfile?> fetchOwnerProfile(String userId) => _authService.fetchOwnerProfile(userId);

  Future<void> refreshToken() => _authService.refreshSession();
}
