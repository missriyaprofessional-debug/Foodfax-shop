import 'dart:async';
import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/owner_profile.dart';
import '../repositories/auth_repository.dart';

enum AuthStatus { initial, authenticating, authenticated, unauthenticated, error }

class OwnerAuthProvider extends ChangeNotifier {
  final AuthRepository _repository;
  StreamSubscription<AuthState>? _authSubscription;

  AuthStatus _status = AuthStatus.initial;
  OwnerProfile? _currentProfile;
  String? _errorMessage;
  bool _isLoading = false;

  OwnerAuthProvider({AuthRepository? repository}) : _repository = repository ?? AuthRepository() {
    _init();
  }

  AuthStatus get status => _status;
  OwnerProfile? get currentProfile => _currentProfile;
  String? get errorMessage => _errorMessage;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _status == AuthStatus.authenticated && _currentProfile != null;

  void _init() {
    _authSubscription = _repository.authStateChanges.listen((data) async {
      final session = data.session;
      if (session != null) {
        await _loadProfile(session.user.id);
      } else {
        _currentProfile = null;
        _status = AuthStatus.unauthenticated;
        notifyListeners();
      }
    });

    // Check existing session
    final current = _repository.currentUser;
    if (current != null) {
      _loadProfile(current.id);
    } else {
      _status = AuthStatus.unauthenticated;
      notifyListeners();
    }
  }

  Future<void> _loadProfile(String userId) async {
    try {
      _currentProfile = await _repository.fetchOwnerProfile(userId);
      _status = AuthStatus.authenticated;
    } catch (e) {
      _status = AuthStatus.authenticated; // Keep authenticated even if profile fetch has network blip
    }
    notifyListeners();
  }

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await _repository.login(email: email, password: password);
      if (res.user != null) {
        await _loadProfile(res.user!.id);
        _isLoading = false;
        notifyListeners();
        return true;
      }
      _errorMessage = 'Invalid credentials';
      _isLoading = false;
      notifyListeners();
      return false;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception:', '').trim();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> register({
    required String email,
    required String password,
    required String fullName,
    String? phone,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await _repository.registerOwner(
        email: email,
        password: password,
        fullName: fullName,
        phone: phone,
      );
      if (res.user != null) {
        await _loadProfile(res.user!.id);
        _isLoading = false;
        notifyListeners();
        return true;
      }
      _errorMessage = 'Registration could not be completed';
      _isLoading = false;
      notifyListeners();
      return false;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception:', '').trim();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    _isLoading = true;
    notifyListeners();
    await _repository.signOut();
    _currentProfile = null;
    _status = AuthStatus.unauthenticated;
    _isLoading = false;
    notifyListeners();
  }

  @override
  void dispose() {
    _authSubscription?.cancel();
    super.dispose();
  }
}
