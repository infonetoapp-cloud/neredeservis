import 'package:flutter/material.dart';

import '../../tokens/color_tokens.dart';
import '../../tokens/radius_tokens.dart';
import '../../tokens/spacing_tokens.dart';
import '../../tokens/typography_tokens.dart';

class AmberPrimaryButton extends StatelessWidget {
  const AmberPrimaryButton({
    super.key,
    required this.label,
    this.onPressed,
    this.fullWidth = true,
  });

  final String label;
  final VoidCallback? onPressed;
  final bool fullWidth;

  static ButtonStyle themeStyle() {
    return FilledButton.styleFrom(
      backgroundColor: AmberColorTokens.amber500,
      foregroundColor: AmberColorTokens.ink900,
      padding: const EdgeInsets.symmetric(
        horizontal: AmberSpacingTokens.space16,
        vertical: AmberSpacingTokens.space12,
      ),
      minimumSize: const Size(44, 48),
      shape: const RoundedRectangleBorder(
        borderRadius: AmberRadiusTokens.radius14,
      ),
      textStyle: const TextStyle(
        fontFamily: AmberTypographyTokens.bodyFamily,
        fontWeight: FontWeight.w600,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final button = FilledButton(
      onPressed: onPressed,
      style: themeStyle(),
      child: Text(label),
    );

    if (!fullWidth) {
      return button;
    }

    return SizedBox(
      width: double.infinity,
      child: button,
    );
  }
}

class AmberSecondaryButton extends StatelessWidget {
  const AmberSecondaryButton({
    super.key,
    required this.label,
    this.onPressed,
    this.fullWidth = true,
    this.isOnDarkSurface = false,
  });

  final String label;
  final VoidCallback? onPressed;
  final bool fullWidth;
  final bool isOnDarkSurface;

  static ButtonStyle themeStyle() {
    return OutlinedButton.styleFrom(
      foregroundColor: AmberColorTokens.ink900,
      side: const BorderSide(color: AmberColorTokens.ink700),
      padding: const EdgeInsets.symmetric(
        horizontal: AmberSpacingTokens.space16,
        vertical: AmberSpacingTokens.space12,
      ),
      minimumSize: const Size(44, 48),
      shape: const RoundedRectangleBorder(
        borderRadius: AmberRadiusTokens.radius14,
      ),
      textStyle: const TextStyle(
        fontFamily: AmberTypographyTokens.bodyFamily,
        fontWeight: FontWeight.w600,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final foregroundColor =
        isOnDarkSurface ? AmberColorTokens.surface0 : AmberColorTokens.ink900;
    final borderColor =
        isOnDarkSurface ? const Color(0x80FFFFFF) : AmberColorTokens.ink700;
    final backgroundColor =
        isOnDarkSurface ? const Color(0x1AFFFFFF) : Colors.transparent;

    final button = OutlinedButton(
      onPressed: onPressed,
      style: OutlinedButton.styleFrom(
        foregroundColor: foregroundColor,
        backgroundColor: backgroundColor,
        side: BorderSide(color: borderColor),
        padding: const EdgeInsets.symmetric(
          horizontal: AmberSpacingTokens.space16,
          vertical: AmberSpacingTokens.space12,
        ),
        minimumSize: const Size(44, 48),
        shape: const RoundedRectangleBorder(
          borderRadius: AmberRadiusTokens.radius14,
        ),
        textStyle: const TextStyle(
          fontFamily: AmberTypographyTokens.bodyFamily,
          fontWeight: FontWeight.w600,
        ),
      ),
      child: Text(label),
    );

    if (!fullWidth) {
      return button;
    }

    return SizedBox(
      width: double.infinity,
      child: button,
    );
  }
}

class AmberDangerButton extends StatelessWidget {
  const AmberDangerButton({
    super.key,
    required this.label,
    this.onPressed,
    this.fullWidth = true,
  });

  final String label;
  final VoidCallback? onPressed;
  final bool fullWidth;

  static ButtonStyle themeStyle() {
    return FilledButton.styleFrom(
      backgroundColor: AmberColorTokens.dangerStrong,
      foregroundColor: AmberColorTokens.surface0,
      padding: const EdgeInsets.symmetric(
        horizontal: AmberSpacingTokens.space16,
        vertical: AmberSpacingTokens.space12,
      ),
      minimumSize: const Size(44, 48),
      shape: const RoundedRectangleBorder(
        borderRadius: AmberRadiusTokens.radius14,
      ),
      textStyle: const TextStyle(
        fontFamily: AmberTypographyTokens.bodyFamily,
        fontWeight: FontWeight.w600,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final button = FilledButton(
      onPressed: onPressed,
      style: themeStyle(),
      child: Text(label),
    );

    if (!fullWidth) {
      return button;
    }

    return SizedBox(
      width: double.infinity,
      child: button,
    );
  }
}
