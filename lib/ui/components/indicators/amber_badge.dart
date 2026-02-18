import 'package:flutter/material.dart';

import '../../tokens/color_tokens.dart';
import '../../tokens/radius_tokens.dart';
import '../../tokens/spacing_tokens.dart';

enum AmberBadgeTone {
  neutral,
  success,
  warning,
  danger,
}

class AmberBadge extends StatelessWidget {
  const AmberBadge({
    super.key,
    required this.label,
    this.tone = AmberBadgeTone.neutral,
    this.leading,
  });

  final String label;
  final AmberBadgeTone tone;
  final IconData? leading;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final palette = _paletteFor(tone);

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AmberSpacingTokens.space8,
        vertical: AmberSpacingTokens.space8 / 2,
      ),
      decoration: BoxDecoration(
        color: palette.background,
        borderRadius: AmberRadiusTokens.radius14,
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
            const SizedBox(width: AmberSpacingTokens.space8 / 2),
          ],
          Text(
            label,
            style: textTheme.labelSmall?.copyWith(color: palette.foreground),
          ),
        ],
      ),
    );
  }

  _AmberBadgePalette _paletteFor(AmberBadgeTone tone) {
    switch (tone) {
      case AmberBadgeTone.success:
        return const _AmberBadgePalette(
          background: Color(0x1F3DA66A),
          foreground: AmberColorTokens.success,
          border: Color(0x663DA66A),
        );
      case AmberBadgeTone.warning:
        return const _AmberBadgePalette(
          background: AmberColorTokens.amber100,
          foreground: AmberColorTokens.amber500,
          border: Color(0x66E8760A),
        );
      case AmberBadgeTone.danger:
        return const _AmberBadgePalette(
          background: Color(0x1FD64E45),
          foreground: AmberColorTokens.danger,
          border: Color(0x66D64E45),
        );
      case AmberBadgeTone.neutral:
        return const _AmberBadgePalette(
          background: AmberColorTokens.surface50,
          foreground: AmberColorTokens.ink700,
          border: AmberColorTokens.line200,
        );
    }
  }
}

class _AmberBadgePalette {
  const _AmberBadgePalette({
    required this.background,
    required this.foreground,
    required this.border,
  });

  final Color background;
  final Color foreground;
  final Color border;
}
