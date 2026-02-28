import 'package:flutter/material.dart';

import '../../tokens/core_colors.dart';
import '../../tokens/core_radii.dart';
import '../../tokens/core_spacing.dart';
import '../../tokens/icon_tokens.dart';

enum CoreStaleSeverity {
  warning,
  elevated,
  critical,
}

class CoreStaleStatusBanner extends StatelessWidget {
  const CoreStaleStatusBanner({
    super.key,
    required this.message,
    this.severity = CoreStaleSeverity.warning,
    this.actionLabel,
    this.onActionTap,
  });

  final String message;
  final CoreStaleSeverity severity;
  final String? actionLabel;
  final VoidCallback? onActionTap;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final palette = _paletteFor(severity);

    return Container(
      padding: const EdgeInsets.all(CoreSpacing.space12),
      decoration: BoxDecoration(
        color: palette.background,
        borderRadius: CoreRadii.radius12,
        border: Border.all(color: palette.border),
        boxShadow: const <BoxShadow>[
          BoxShadow(
            color: Color(0x0F0A1411),
            blurRadius: 10,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Icon(
            severity == CoreStaleSeverity.warning
                ? CoreIconTokens.clock
                : CoreIconTokens.warning,
            color: palette.foreground,
            size: 18,
          ),
          const SizedBox(width: CoreSpacing.space8),
          Expanded(
            child: Text(
              message,
              style: textTheme.bodyMedium?.copyWith(
                color: palette.foreground,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          if (actionLabel != null && onActionTap != null)
            TextButton(
              onPressed: onActionTap,
              child: Text(actionLabel!),
            ),
        ],
      ),
    );
  }

  _BannerPalette _paletteFor(CoreStaleSeverity severity) {
    switch (severity) {
      case CoreStaleSeverity.warning:
        return const _BannerPalette(
          background: CoreColors.amber100,
          foreground: CoreColors.warning,
          border: Color(0x668A5F00),
        );
      case CoreStaleSeverity.elevated:
        return const _BannerPalette(
          background: Color(0x1A1B1E1D),
          foreground: CoreColors.ink900,
          border: Color(0x331B1E1D),
        );
      case CoreStaleSeverity.critical:
        return const _BannerPalette(
          background: Color(0x1FB93A3F),
          foreground: CoreColors.dangerStrong,
          border: Color(0x66B93A3F),
        );
    }
  }
}

class _BannerPalette {
  const _BannerPalette({
    required this.background,
    required this.foreground,
    required this.border,
  });

  final Color background;
  final Color foreground;
  final Color border;
}
