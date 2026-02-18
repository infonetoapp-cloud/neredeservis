import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../ui/theme/theme_amber.dart';

final themeModeProvider =
    StateNotifierProvider<ThemeModeController, ThemeMode>((ref) {
  return ThemeModeController();
});

final amberLightThemeProvider = Provider<ThemeData>((ref) {
  return AmberTheme.light();
});

class ThemeModeController extends StateNotifier<ThemeMode> {
  ThemeModeController() : super(ThemeMode.light);

  void setThemeMode(ThemeMode mode) {
    state = mode;
  }
}
