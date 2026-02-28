import 'package:flutter/material.dart';

import '../../tokens/core_colors.dart';
import '../../tokens/core_radii.dart';
import '../../tokens/core_spacing.dart';

enum CoreStatusChipTone {
  neutral,
  green,
  yellow,
  orange,
  red,
}

class CoreStatusChip extends StatelessWidget {
  const CoreStatusChip({
    super.key,
    required this.label,
    required this.tone,
    this.compact = false,
  });

  final String label;
  final CoreStatusChipTone tone;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final palette = _paletteFor(tone);
    final verticalPadding = compact ? 5.0 : 7.0;

    return Container(
      padding: EdgeInsets.symmetric(
        horizontal:
            compact ? CoreSpacing.space8 : CoreSpacing.space10,
        vertical: verticalPadding,
      ),
      decoration: BoxDecoration(
        color: palette.background,
        borderRadius: CoreRadii.radius28,
        border: Border.all(color: palette.border),
        boxShadow: compact
            ? null
            : const <BoxShadow>[
                BoxShadow(
                  color: Color(0x120A1411),
                  blurRadius: 8,
                  offset: Offset(0, 3),
                ),
              ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          Container(
            width: compact ? 7 : 8,
            height: compact ? 7 : 8,
            decoration: BoxDecoration(
              color: palette.foreground,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: CoreSpacing.space8),
          Text(
            label,
            style: textTheme.labelSmall?.copyWith(
              color: palette.foreground,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.12,
            ),
          ),
        ],
      ),
    );
  }

  _StatusPalette _paletteFor(CoreStatusChipTone tone) {
    switch (tone) {
      case CoreStatusChipTone.green:
        return const _StatusPalette(
          background: Color(0x1F1F9E6C),
          foreground: CoreColors.success,
          border: Color(0x661F9E6C),
        );
      case CoreStatusChipTone.yellow:
        return const _StatusPalette(
          background: CoreColors.amber100,
          foreground: CoreColors.warning,
          border: Color(0x668A5F00),
        );
      case CoreStatusChipTone.red:
        return const _StatusPalette(
          background: Color(0x1FC13E36),
          foreground: CoreColors.dangerStrong,
          border: Color(0x66C13E36),
        );
      case CoreStatusChipTone.orange:
        return const _StatusPalette(
          background: Color(0x1A1B1E1D),
          foreground: CoreColors.ink900,
          border: Color(0x331B1E1D),
        );
      case CoreStatusChipTone.neutral:
        return const _StatusPalette(
          background: CoreColors.surface50,
          foreground: CoreColors.ink500,
          border: CoreColors.line200,
        );
    }
  }
}

class _StatusPalette {
  const _StatusPalette({
    required this.background,
    required this.foreground,
    required this.border,
  });

  final Color background;
  final Color foreground;
  final Color border;
}
