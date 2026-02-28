import 'package:flutter/material.dart';

import '../../tokens/core_colors.dart';
import '../../tokens/core_radii.dart';
import '../../tokens/core_spacing.dart';

class CoreInputStyles {
  const CoreInputStyles._();

  static InputDecorationTheme theme(TextTheme textTheme) {
    return InputDecorationTheme(
      filled: true,
      fillColor: CoreColors.surface0,
      contentPadding: const EdgeInsets.symmetric(
        horizontal: CoreSpacing.space18,
        vertical: CoreSpacing.space12,
      ),
      enabledBorder: _border(CoreColors.line200, width: 1.2),
      focusedBorder: _border(CoreColors.amber500, width: 1.6),
      errorBorder: _border(CoreColors.danger, width: 1.3),
      focusedErrorBorder: _border(CoreColors.dangerStrong, width: 1.6),
      border: _border(CoreColors.line200, width: 1.2),
      hintStyle: textTheme.bodyMedium?.copyWith(
        color: CoreColors.ink500,
      ),
      labelStyle: textTheme.bodyMedium?.copyWith(
        color: CoreColors.ink500,
      ),
      floatingLabelStyle: textTheme.labelMedium?.copyWith(
        color: CoreColors.ink700,
      ),
      errorStyle: textTheme.bodySmall?.copyWith(
        color: CoreColors.dangerStrong,
      ),
      helperStyle: textTheme.bodySmall?.copyWith(
        color: CoreColors.ink500,
      ),
      prefixIconColor: CoreColors.ink500,
      suffixIconColor: CoreColors.ink500,
    );
  }

  static OutlineInputBorder _border(Color color, {double width = 1}) {
    return OutlineInputBorder(
      borderRadius: CoreRadii.radius12,
      borderSide: BorderSide(color: color, width: width),
    );
  }
}
