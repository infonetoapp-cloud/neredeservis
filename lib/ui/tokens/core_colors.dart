import 'package:flutter/material.dart';

class CoreColors {
  const CoreColors._();

  // Primary accent family (monochrome premium - Uber Style).
  static const Color primary = Color(0xFF000000); // Pure Black
  static const Color primaryHover = Color(0xFF1A1A1A); // Dark Gray

  // Ink family (Text and icons).
  static const Color ink900 = Color(0xFF121212); // Primary Text
  static const Color ink700 = Color(0xFF4A4A4A); // Secondary Text
  static const Color ink500 = Color(0xFF8F8F8F); // Tertiary/Hint Text

  // Surface family.
  static const Color surface0 = Color(0xFFFFFFFF); // Pure White Base
  static const Color surface50 = Color(0xFFF7F7F7); // Off-white Backgrounds
  static const Color surface100 = Color(0xFFEBEBEB); // Slightly darker surfaces
  static const Color line200 = Color(0xFFE0E0E0); // Borders and dividers

  // Semantic colors (Keeping them clean but distinct).
  static const Color success = Color(0xFF0F9D58);
  // Dark amber tuned for readable foreground usage on light warning surfaces.
  static const Color warning = Color(0xFF8A5F00);
  static const Color danger = Color(0xFFD93025);

  // Semantic intensity aliases.
  static const Color successStrong = success;
  static const Color warningStrong = warning;
  static const Color dangerStrong = danger;

  // Overlay helpers for map and glass surfaces.
  static const Color mapNight900 = Color(0xFF0B151D);
  static const Color scrim700 = Color(0xB3000000); // Black with 70% opacity

  // Legacy aliases → mapped to monochrome equivalents.
  static const Color amber100 = surface100;
  static const Color amber400 = primaryHover;
  static const Color amber500 = primary;
}
