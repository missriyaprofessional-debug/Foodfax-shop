import 'package:flutter/material.dart';

class AppColors {
  // Brand FoodFax Orange
  static const Color primary = Color(0xFFFF5722);
  static const Color primaryDark = Color(0xFFE64A19);
  static const Color primaryLight = Color(0xFFFF8A65);
  static const Color primaryAccent = Color(0xFFFF6D00);

  // Backgrounds & Surface
  static const Color background = Color(0xFF0F172A); // Slate 900
  static const Color surface = Color(0xFF1E293B);    // Slate 800
  static const Color card = Color(0xFF1E293B);
  static const Color cardBorder = Color(0xFF334155);

  // Status Colors
  static const Color statusPending = Color(0xFFF59E0B);   // Amber 500
  static const Color statusAccepted = Color(0xFF3B82F6);  // Blue 500
  static const Color statusPreparing = Color(0xFF8B5CF6); // Purple 500
  static const Color statusReady = Color(0xFF10B981);     // Emerald 500
  static const Color statusCompleted = Color(0xFF14B8A6); // Teal 500
  static const Color statusCancelled = Color(0xFFEF4444); // Red 500

  // Rush Mode
  static const Color rushActive = Color(0xFFEF4444);
  static const Color rushWarning = Color(0xFFF59E0B);

  // Functional & Accents
  static const Color vegGreen = Color(0xFF22C55E);
  static const Color nonVegRed = Color(0xFFEF4444);

  // Text Colors
  static const Color textPrimary = Color(0xFFF8FAFC);
  static const Color textSecondary = Color(0xFF94A3B8);
  static const Color textMuted = Color(0xFF64748B);
}
