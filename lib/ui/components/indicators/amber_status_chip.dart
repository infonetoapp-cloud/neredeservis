import 'package:flutter/material.dart';

import '../../tokens/color_tokens.dart';
import '../../tokens/radius_tokens.dart';
import '../../tokens/spacing_tokens.dart';

enum AmberStatusChipTone {
  neutral,
  green,
  yellow,
  red,
}

class AmberStatusChip extends StatelessWidget {
  const AmberStatusChip({
    super.key,
    required this.label,
    required this.tone,
    this.compact = false,
  });

  final String label;
  final AmberStatusChipTone tone;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final palette = _paletteFor(tone);
    final verticalPadding = compact ? 4.0 : 6.0;

    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: AmberSpacingTokens.space8,
        vertical: verticalPadding,
      ),
      decoration: BoxDecoration(
        color: palette.background,
        borderRadius: AmberRadiusTokens.radius28,
        border: Border.all(color: palette.border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              color: palette.foreground,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: AmberSpacingTokens.space8),
          Text(
            label,
            style: textTheme.labelSmall?.copyWith(color: palette.foreground),
          ),
        ],
      ),
    );
  }

  _StatusPalette _paletteFor(AmberStatusChipTone tone) {
    switch (tone) {
      case AmberStatusChipTone.green:
        return const _StatusPalette(
          background: Color(0x1F3DA66A),
          foreground: AmberColorTokens.success,
          border: Color(0x663DA66A),
        );
      case AmberStatusChipTone.yellow:
        return const _StatusPalette(
          background: AmberColorTokens.amber100,
          foreground: AmberColorTokens.amber500,
          border: Color(0x66E8760A),
        );
      case AmberStatusChipTone.red:
        return const _StatusPalette(
          background: Color(0x1FD64E45),
          foreground: AmberColorTokens.danger,
          border: Color(0x66D64E45),
        );
      case AmberStatusChipTone.neutral:
        return const _StatusPalette(
          background: AmberColorTokens.surface50,
          foreground: AmberColorTokens.ink700,
          border: AmberColorTokens.line200,
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
