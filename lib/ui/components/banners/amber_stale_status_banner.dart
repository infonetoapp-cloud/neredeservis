import 'package:flutter/material.dart';

import '../../tokens/color_tokens.dart';
import '../../tokens/radius_tokens.dart';
import '../../tokens/spacing_tokens.dart';

enum AmberStaleSeverity {
  warning,
  critical,
}

class AmberStaleStatusBanner extends StatelessWidget {
  const AmberStaleStatusBanner({
    super.key,
    required this.message,
    this.severity = AmberStaleSeverity.warning,
    this.actionLabel,
    this.onActionTap,
  });

  final String message;
  final AmberStaleSeverity severity;
  final String? actionLabel;
  final VoidCallback? onActionTap;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final palette = _paletteFor(severity);

    return Container(
      padding: const EdgeInsets.all(AmberSpacingTokens.space12),
      decoration: BoxDecoration(
        color: palette.background,
        borderRadius: AmberRadiusTokens.radius14,
        border: Border.all(color: palette.border),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Icon(
            severity == AmberStaleSeverity.warning
                ? Icons.access_time_filled
                : Icons.warning_amber_rounded,
            color: palette.foreground,
            size: 18,
          ),
          const SizedBox(width: AmberSpacingTokens.space8),
          Expanded(
            child: Text(
              message,
              style: textTheme.bodyMedium?.copyWith(color: palette.foreground),
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

  _BannerPalette _paletteFor(AmberStaleSeverity severity) {
    switch (severity) {
      case AmberStaleSeverity.warning:
        return const _BannerPalette(
          background: AmberColorTokens.amber100,
          foreground: AmberColorTokens.amber500,
          border: Color(0x66E8760A),
        );
      case AmberStaleSeverity.critical:
        return const _BannerPalette(
          background: Color(0x1FD64E45),
          foreground: AmberColorTokens.danger,
          border: Color(0x66D64E45),
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
