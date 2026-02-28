import 'package:flutter/material.dart';

import '../components/buttons/core_buttons.dart';
import '../components/forms/core_input_styles.dart';
import '../tokens/core_colors.dart';
import '../tokens/core_elevations.dart';
import '../tokens/core_radii.dart';
import '../tokens/core_spacing.dart';
import '../tokens/core_typography.dart';

class CoreThemeBuilder {
  const CoreThemeBuilder._();

  static ThemeData buildLightTheme() {
    final baseScheme = ColorScheme.fromSeed(
      seedColor: CoreColors.primary,
      brightness: Brightness.light,
    );

    final colorScheme = baseScheme.copyWith(
      primary: CoreColors.primary,
      onPrimary: CoreColors.surface0,
      primaryContainer: CoreColors.surface100,
      onPrimaryContainer: CoreColors.ink900,
      secondary: CoreColors.ink700,
      onSecondary: CoreColors.surface0,
      tertiary: CoreColors.success,
      onTertiary: CoreColors.surface0,
      surface: CoreColors.surface0,
      onSurface: CoreColors.ink900,
      surfaceContainerHighest: CoreColors.surface100,
      outline: CoreColors.line200,
      error: CoreColors.danger,
      onError: CoreColors.surface0,
    );

    final textTheme =
        CoreTypography.apply(ThemeData(brightness: Brightness.light).textTheme)
            .apply(
      bodyColor: CoreColors.ink900,
      displayColor: CoreColors.ink900,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: CoreColors.surface50,
      canvasColor: CoreColors.surface50,
      dividerColor: CoreColors.line200,
      textTheme: textTheme,
      appBarTheme: AppBarTheme(
        backgroundColor: CoreColors.surface0,
        foregroundColor: CoreColors.ink900,
        elevation: CoreElevations.level1,
        scrolledUnderElevation: CoreElevations.level1,
        surfaceTintColor: Colors.transparent,
        centerTitle: true,
        titleTextStyle: textTheme.titleLarge?.copyWith(
          fontWeight: FontWeight.w700,
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: CorePrimaryButton
            .themeStyle(), // Will be updated to CorePrimaryButton
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: CoreSecondaryButton.themeStyle(), // Will be updated
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          minimumSize: const Size(44, 44),
          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
          foregroundColor: CoreColors.primary,
          textStyle: textTheme.labelLarge,
        ),
      ),
      iconButtonTheme: IconButtonThemeData(
        style: IconButton.styleFrom(
          minimumSize: const Size(44, 44),
          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
          foregroundColor: CoreColors.primaryHover,
          backgroundColor: Colors.transparent,
        ),
      ),
      cardTheme: CardThemeData(
        color: CoreColors.surface0,
        surfaceTintColor: Colors.transparent,
        elevation: CoreElevations.level1,
        shadowColor: CoreElevations.shadowLevel1.first.color,
        margin: EdgeInsets.zero,
        shape: const RoundedRectangleBorder(
          borderRadius: CoreRadii.radius12,
          side: BorderSide(color: CoreColors.line200, width: 0.5),
        ),
      ),
      inputDecorationTheme: CoreInputStyles.theme(textTheme), // Will be updated
      snackBarTheme: SnackBarThemeData(
        backgroundColor: CoreColors.ink900,
        contentTextStyle: textTheme.bodyMedium?.copyWith(
          color: CoreColors.surface0,
        ),
        behavior: SnackBarBehavior.floating,
        shape: const RoundedRectangleBorder(
          borderRadius: CoreRadii.radius8,
        ),
        insetPadding: const EdgeInsets.all(CoreSpacing.space16),
      ),
      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor: CoreColors.surface0,
        surfaceTintColor: Colors.transparent,
        elevation: CoreElevations.level3,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(CoreRadii.radius24Value),
            topRight: Radius.circular(CoreRadii.radius24Value),
          ),
        ),
      ),
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: CoreColors.surface0,
        selectedItemColor: CoreColors.primary,
        unselectedItemColor: CoreColors.ink500,
        selectedLabelStyle: textTheme.labelSmall?.copyWith(
          fontWeight: FontWeight.w700,
        ),
        unselectedLabelStyle: textTheme.labelSmall?.copyWith(
          color: CoreColors.ink500,
        ),
        type: BottomNavigationBarType.fixed,
        elevation: 0,
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: CoreColors.surface0,
        elevation: CoreElevations.level0,
        indicatorColor: CoreColors.surface100,
        labelTextStyle: WidgetStateProperty.resolveWith<TextStyle?>(
          (states) {
            final isSelected = states.contains(WidgetState.selected);
            return textTheme.labelSmall?.copyWith(
              fontWeight: isSelected ? FontWeight.w700 : FontWeight.w600,
              color: isSelected ? CoreColors.primary : CoreColors.ink500,
            );
          },
        ),
      ),
      floatingActionButtonTheme: const FloatingActionButtonThemeData(
        backgroundColor: CoreColors.primary,
        foregroundColor: CoreColors.surface0,
      ),
    );
  }
}
