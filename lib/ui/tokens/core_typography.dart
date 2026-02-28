import 'package:flutter/material.dart';

class CoreTypography {
  const CoreTypography._();

  // Uber relies heavily on Inter / System Native fonts for maximum legibility.
  static const String headlineFamily = 'Inter';
  static const String bodyFamily = 'Inter';
  static const String headingFamily = headlineFamily; // Legacy alias
  static const List<String> fallbackFamily = <String>['sans-serif'];

  static TextTheme apply(TextTheme base) {
    return base.copyWith(
      headlineLarge: _style(
        base.headlineLarge,
        FontWeight.w700,
        height: 1.1,
        letterSpacing: -1.0,
      ),
      headlineMedium: _style(
        base.headlineMedium,
        FontWeight.w700,
        height: 1.15,
        letterSpacing: -0.5,
      ),
      headlineSmall: _style(
        base.headlineSmall,
        FontWeight.w600,
        height: 1.2,
        letterSpacing: -0.3,
      ),
      titleLarge: _style(
        base.titleLarge,
        FontWeight.w600,
        height: 1.25,
        letterSpacing: -0.2,
      ),
      titleMedium: _style(
        base.titleMedium,
        FontWeight.w600,
        height: 1.3,
        letterSpacing: 0,
      ),
      titleSmall: _style(
        base.titleSmall,
        FontWeight.w600,
        height: 1.3,
        letterSpacing: 0.1,
      ),
      bodyLarge: _style(
        base.bodyLarge,
        FontWeight.w400,
        height: 1.5,
        letterSpacing: 0,
      ),
      bodyMedium: _style(
        base.bodyMedium,
        FontWeight.w400,
        height: 1.5,
        letterSpacing: 0.1,
      ),
      bodySmall: _style(
        base.bodySmall,
        FontWeight.w400,
        height: 1.5,
        letterSpacing: 0.2,
      ),
      labelLarge: _style(
        base.labelLarge,
        FontWeight.w600,
        height: 1.2,
        letterSpacing: 0.5,
      ),
      labelMedium: _style(
        base.labelMedium,
        FontWeight.w600,
        height: 1.2,
        letterSpacing: 0.5,
      ),
      labelSmall: _style(
        base.labelSmall,
        FontWeight.w600,
        height: 1.2,
        letterSpacing: 0.5,
      ),
    );
  }

  static TextStyle? _style(
    TextStyle? style,
    FontWeight weight, {
    double? height,
    double? letterSpacing,
  }) {
    return style?.copyWith(
      fontFamily: bodyFamily,
      fontFamilyFallback: fallbackFamily,
      fontWeight: weight,
      height: height,
      letterSpacing: letterSpacing,
    );
  }
}
