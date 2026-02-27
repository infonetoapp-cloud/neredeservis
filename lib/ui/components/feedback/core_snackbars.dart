import 'package:flutter/material.dart';

import '../../tokens/core_colors.dart';
import '../../tokens/icon_tokens.dart';

enum CoreSnackbarTone {
  info,
  success,
  warning,
  error,
}

class CoreSnackbars {
  const CoreSnackbars._();

  static ScaffoldFeatureController<SnackBar, SnackBarClosedReason> show(
    BuildContext context, {
    required String message,
    CoreSnackbarTone tone = CoreSnackbarTone.info,
  }) {
    final palette = _paletteFor(tone);
    final messenger = ScaffoldMessenger.of(context);

    messenger.hideCurrentSnackBar();
    return messenger.showSnackBar(
      SnackBar(
        backgroundColor: palette.background,
        behavior: SnackBarBehavior.floating,
        content: Row(
          children: <Widget>[
            Icon(
              palette.icon,
              size: 18,
              color: palette.foreground,
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                message,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: palette.foreground,
                    ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  static _SnackbarPalette _paletteFor(CoreSnackbarTone tone) {
    switch (tone) {
      case CoreSnackbarTone.info:
        return const _SnackbarPalette(
          background: CoreColors.ink900,
          foreground: CoreColors.surface0,
          icon: CoreIconTokens.info,
        );
      case CoreSnackbarTone.success:
        return const _SnackbarPalette(
          background: CoreColors.successStrong,
          foreground: CoreColors.surface0,
          icon: CoreIconTokens.checkCircle,
        );
      case CoreSnackbarTone.warning:
        return const _SnackbarPalette(
          background: CoreColors.warningStrong,
          foreground: CoreColors.surface0,
          icon: CoreIconTokens.warning,
        );
      case CoreSnackbarTone.error:
        return const _SnackbarPalette(
          background: CoreColors.dangerStrong,
          foreground: CoreColors.surface0,
          icon: CoreIconTokens.warning,
        );
    }
  }
}

class _SnackbarPalette {
  const _SnackbarPalette({
    required this.background,
    required this.foreground,
    required this.icon,
  });

  final Color background;
  final Color foreground;
  final IconData icon;
}
