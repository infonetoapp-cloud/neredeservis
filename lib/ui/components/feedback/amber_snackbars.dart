import 'package:flutter/material.dart';

import '../../tokens/color_tokens.dart';
import '../../tokens/icon_tokens.dart';

enum AmberSnackbarTone {
  info,
  success,
  warning,
  error,
}

class AmberSnackbars {
  const AmberSnackbars._();

  static ScaffoldFeatureController<SnackBar, SnackBarClosedReason> show(
    BuildContext context, {
    required String message,
    AmberSnackbarTone tone = AmberSnackbarTone.info,
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

  static _SnackbarPalette _paletteFor(AmberSnackbarTone tone) {
    switch (tone) {
      case AmberSnackbarTone.info:
        return const _SnackbarPalette(
          background: AmberColorTokens.ink900,
          foreground: AmberColorTokens.surface0,
          icon: AmberIconTokens.info,
        );
      case AmberSnackbarTone.success:
        return const _SnackbarPalette(
          background: AmberColorTokens.successStrong,
          foreground: AmberColorTokens.surface0,
          icon: AmberIconTokens.checkCircle,
        );
      case AmberSnackbarTone.warning:
        return const _SnackbarPalette(
          background: AmberColorTokens.warningStrong,
          foreground: AmberColorTokens.surface0,
          icon: AmberIconTokens.warning,
        );
      case AmberSnackbarTone.error:
        return const _SnackbarPalette(
          background: AmberColorTokens.dangerStrong,
          foreground: AmberColorTokens.surface0,
          icon: AmberIconTokens.warning,
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
