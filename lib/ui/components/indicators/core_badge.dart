import 'package:flutter/material.dart';

import '../../tokens/core_colors.dart';
import '../../tokens/core_radii.dart';
import '../../tokens/core_spacing.dart';

enum CoreBadgeTone {
  neutral,
  success,
  warning,
  danger,
}

class CoreBadge extends StatelessWidget {
  const CoreBadge({
    super.key,
    required this.label,
    this.tone = CoreBadgeTone.neutral,
    this.leading,
  });

  final String label;
  final CoreBadgeTone tone;
  final IconData? leading;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final palette = _paletteFor(tone);

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: CoreSpacing.space8,
        vertical: CoreSpacing.space8 / 2,
      ),
      decoration: BoxDecoration(
        color: palette.background,
        borderRadius: CoreRadii.radius12,
        border: Border.all(color: palette.border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          if (leading != null) ...<Widget>[
            Icon(
              leading,
              size: 14,
              color: palette.foreground,
            ),
            const SizedBox(width: CoreSpacing.space8 / 2),
          ],
          Text(
            label,
            style: textTheme.labelSmall?.copyWith(
              color: palette.foreground,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }

  _CoreBadgePalette _paletteFor(CoreBadgeTone tone) {
    switch (tone) {
      case CoreBadgeTone.success:
        return const _CoreBadgePalette(
          background: Color(0x1F3DA66A),
          foreground: CoreColors.success,
          border: Color(0x663DA66A),
        );
      case CoreBadgeTone.warning:
        return const _CoreBadgePalette(
          background: CoreColors.amber100,
          foreground: CoreColors.warning,
          border: Color(0x668A5F00),
        );
      case CoreBadgeTone.danger:
        return const _CoreBadgePalette(
          background: Color(0x1FD64E45),
          foreground: CoreColors.danger,
          border: Color(0x66D64E45),
        );
      case CoreBadgeTone.neutral:
        return const _CoreBadgePalette(
          background: CoreColors.surface50,
          foreground: CoreColors.ink700,
          border: CoreColors.line200,
        );
    }
  }
}

class _CoreBadgePalette {
  const _CoreBadgePalette({
    required this.background,
    required this.foreground,
    required this.border,
  });

  final Color background;
  final Color foreground;
  final Color border;
}
