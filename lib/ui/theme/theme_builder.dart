import 'package:flutter/material.dart';

import '../components/buttons/amber_buttons.dart';
import '../components/forms/amber_input_styles.dart';
import '../tokens/color_tokens.dart';
import '../tokens/elevation_tokens.dart';
import '../tokens/radius_tokens.dart';
import '../tokens/spacing_tokens.dart';
import '../tokens/typography_tokens.dart';

class AmberThemeBuilder {
  const AmberThemeBuilder._();

  static ThemeData buildLightTheme() {
    final baseScheme = ColorScheme.fromSeed(
      seedColor: AmberColorTokens.amber500,
      brightness: Brightness.light,
    );

    final colorScheme = baseScheme.copyWith(
      primary: AmberColorTokens.amber500,
      onPrimary: AmberColorTokens.ink900,
      primaryContainer: AmberColorTokens.amber100,
      onPrimaryContainer: AmberColorTokens.ink900,
      secondary: AmberColorTokens.ink700,
      onSecondary: AmberColorTokens.surface0,
      tertiary: AmberColorTokens.success,
      onTertiary: AmberColorTokens.surface0,
      surface: AmberColorTokens.surface0,
      onSurface: AmberColorTokens.ink900,
      surfaceContainerHighest: AmberColorTokens.surface50,
      outline: AmberColorTokens.line200,
      error: AmberColorTokens.danger,
      onError: AmberColorTokens.surface0,
    );

    final textTheme = AmberTypographyTokens.apply(
      ThemeData(brightness: Brightness.light).textTheme,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: AmberColorTokens.surface50,
      dividerColor: AmberColorTokens.line200,
      textTheme: textTheme,
      appBarTheme: AppBarTheme(
        backgroundColor: AmberColorTokens.surface50,
        foregroundColor: AmberColorTokens.ink900,
        elevation: AmberElevationTokens.level0,
        surfaceTintColor: Colors.transparent,
        titleTextStyle: textTheme.titleLarge,
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: AmberPrimaryButton.themeStyle(),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: AmberSecondaryButton.themeStyle(),
      ),
      cardTheme: const CardTheme(
        color: AmberColorTokens.surface0,
        surfaceTintColor: Colors.transparent,
        elevation: AmberElevationTokens.level1,
        shape: RoundedRectangleBorder(
          borderRadius: AmberRadiusTokens.radius20,
        ),
      ),
      inputDecorationTheme: AmberInputStyles.theme(textTheme),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: AmberColorTokens.ink900,
        contentTextStyle: textTheme.bodyMedium?.copyWith(
          color: AmberColorTokens.surface0,
        ),
        behavior: SnackBarBehavior.floating,
        shape: const RoundedRectangleBorder(
          borderRadius: AmberRadiusTokens.radius14,
        ),
        insetPadding: const EdgeInsets.all(AmberSpacingTokens.space16),
      ),
      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor: Colors.transparent,
        surfaceTintColor: Colors.transparent,
        elevation: AmberElevationTokens.level0,
      ),
    );
  }
}
