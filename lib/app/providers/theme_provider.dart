import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../ui/theme/core_theme.dart';

final themeModeProvider =
    StateNotifierProvider<ThemeModeController, ThemeMode>((ref) {
  return ThemeModeController();
});

final coreLightThemeProvider = Provider<ThemeData>((ref) {
  return CoreTheme.light();
});

class ThemeModeController extends StateNotifier<ThemeMode> {
  ThemeModeController() : super(ThemeMode.light);

  void setThemeMode(ThemeMode mode) {
    state = mode;
  }
}
