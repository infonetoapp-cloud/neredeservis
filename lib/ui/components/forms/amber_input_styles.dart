import 'package:flutter/material.dart';

import '../../tokens/color_tokens.dart';
import '../../tokens/radius_tokens.dart';
import '../../tokens/spacing_tokens.dart';

class AmberInputStyles {
  const AmberInputStyles._();

  static InputDecorationTheme theme(TextTheme textTheme) {
    return InputDecorationTheme(
      filled: true,
      fillColor: AmberColorTokens.surface0,
      contentPadding: const EdgeInsets.symmetric(
        horizontal: AmberSpacingTokens.space16,
        vertical: AmberSpacingTokens.space12,
      ),
      enabledBorder: _border(AmberColorTokens.line200),
      focusedBorder: _border(AmberColorTokens.amber500, width: 1.5),
      errorBorder: _border(AmberColorTokens.danger),
      focusedErrorBorder: _border(AmberColorTokens.danger, width: 1.5),
      border: _border(AmberColorTokens.line200),
      hintStyle: textTheme.bodyMedium?.copyWith(
        color: AmberColorTokens.ink700,
      ),
      labelStyle: textTheme.bodyMedium?.copyWith(
        color: AmberColorTokens.ink700,
      ),
      errorStyle: textTheme.bodySmall?.copyWith(
        color: AmberColorTokens.danger,
      ),
    );
  }

  static OutlineInputBorder _border(Color color, {double width = 1}) {
    return OutlineInputBorder(
      borderRadius: AmberRadiusTokens.radius14,
      borderSide: BorderSide(color: color, width: width),
    );
  }
}
