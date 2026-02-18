import 'package:flutter/material.dart';

class AmberTypographyTokens {
  const AmberTypographyTokens._();

  static const String headingFamily = 'Space Grotesk';
  static const String bodyFamily = 'Manrope';

  // Reference license note for bundling strategy decisions in STEP-133A/B.
  static const String licenseNote =
      'Space Grotesk and Manrope are distributed under SIL OFL 1.1.';

  static TextTheme apply(TextTheme base) {
    return base.copyWith(
      headlineLarge: _heading(base.headlineLarge, FontWeight.w800),
      headlineMedium: _heading(base.headlineMedium, FontWeight.w700),
      headlineSmall: _heading(base.headlineSmall, FontWeight.w700),
      titleLarge: _heading(base.titleLarge, FontWeight.w700),
      titleMedium: _body(base.titleMedium, FontWeight.w600),
      titleSmall: _body(base.titleSmall, FontWeight.w600),
      bodyLarge: _body(base.bodyLarge, FontWeight.w500),
      bodyMedium: _body(base.bodyMedium, FontWeight.w500),
      bodySmall: _body(base.bodySmall, FontWeight.w500),
      labelLarge: _body(base.labelLarge, FontWeight.w600),
      labelMedium: _body(base.labelMedium, FontWeight.w600),
      labelSmall: _body(base.labelSmall, FontWeight.w600),
    );
  }

  static TextStyle? _heading(TextStyle? style, FontWeight weight) {
    return style?.copyWith(fontFamily: headingFamily, fontWeight: weight);
  }

  static TextStyle? _body(TextStyle? style, FontWeight weight) {
    return style?.copyWith(fontFamily: bodyFamily, fontWeight: weight);
  }
}
