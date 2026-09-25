import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../core/constants.dart';
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
  User? get currentUser => _repository.currentUser;
  String? get currentUserId => _currentProfile?.id ?? _repository.currentUser?.id;
  String? get errorMessage => _errorMessage;
  bool get isLoading => _isLoading;
  bool get isAuthenticated =>
      (_status == AuthStatus.authenticated || _repository.isAuthenticated) &&
      (_currentProfile != null || _repository.currentUser != null);

  void _init() async {
    // 1. Restore local cached profile if available
    try {
      final prefs = await SharedPreferences.getInstance();
      final cachedJson = prefs.getString('foodfax_cached_owner_profile');
      if (cachedJson != null && cachedJson.isNotEmpty) {
        _currentProfile = OwnerProfile.fromJson(jsonDecode(cachedJson));
        _status = AuthStatus.authenticated;
        notifyListeners();
      }
    } catch (_) {}

    // 2. Listen to Supabase Auth state changes
    _authSubscription = _repository.authStateChanges.listen((data) async {
      final session = data.session;
      if (session != null) {
        await _loadProfile(session.user.id);
      } else if (_currentProfile == null) {
        _status = AuthStatus.unauthenticated;
        notifyListeners();
      }
    });

    // 3. Check current Supabase session
    final current = _repository.currentUser;
    if (current != null) {
      await _loadProfile(current.id);
    } else if (_currentProfile == null) {
      _status = AuthStatus.unauthenticated;
      notifyListeners();
    }
  }

  Future<void> _loadProfile(String userId) async {
    try {
      final profile = await _repository.fetchOwnerProfile(userId);
      if (profile != null) {
        _currentProfile = profile;
        _saveProfileLocally(profile);
      } else if (_repository.currentUser != null) {
        final u = _repository.currentUser!;
        _currentProfile = OwnerProfile(
          id: u.id,
          email: u.email ?? '',
          fullName: u.userMetadata?['full_name'] as String? ?? 'Restaurant Owner',
          phone: u.userMetadata?['phone'] as String?,
          role: 'owner',
        );
        _saveProfileLocally(_currentProfile!);
      }
      _status = AuthStatus.authenticated;
    } catch (e) {
      _status = AuthStatus.authenticated;
    }
    notifyListeners();
  }

  void _saveProfileLocally(OwnerProfile profile) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('foodfax_cached_owner_profile', jsonEncode(profile.toJson()));
      await prefs.setBool(AppConstants.prefHasOnboarded, true);
    } catch (_) {}
  }

  Future<bool> loginWithPhone(String phone, String password) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await _repository.loginWithPhone(phone: phone, password: password);
      final userId = res.user?.id ?? _repository.currentUser?.id;
      if (userId != null) {
        await _loadProfile(userId);
        final prefs = await SharedPreferences.getInstance();
        await prefs.setBool(AppConstants.prefHasOnboarded, true);
        _isLoading = false;
        notifyListeners();
        return true;
      }

      // If user session is active
      if (_repository.isAuthenticated) {
        await _loadProfile(_repository.currentUser!.id);
        _isLoading = false;
        notifyListeners();
        return true;
      }

      _errorMessage = 'Invalid phone number or password';
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

  Future<bool> sendPhoneOtp(String phone) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      await _repository.sendPhoneOtp(phone);
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception:', '').trim();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> verifyPhoneOtp(String phone, String otp) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await _repository.verifyPhoneOtp(phone: phone, token: otp);
      final userId = res.user?.id ?? _repository.currentUser?.id;
      if (userId != null) {
        await _loadProfile(userId);
        final prefs = await SharedPreferences.getInstance();
        await prefs.setBool(AppConstants.prefHasOnboarded, true);
        _isLoading = false;
        notifyListeners();
        return true;
      }
      _errorMessage = 'Invalid or expired OTP';
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

  Future<bool> registerWithPhone({
    required String phone,
    required String password,
    required String fullName,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await _repository.registerOwnerWithPhone(
        phone: phone,
        password: password,
        fullName: fullName,
      );
      final userId = res.user?.id ?? _repository.currentUser?.id;
      if (userId != null) {
        await _loadProfile(userId);
        final prefs = await SharedPreferences.getInstance();
        await prefs.setBool(AppConstants.prefHasOnboarded, true);
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
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('foodfax_cached_owner_profile');
    } catch (_) {}
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
