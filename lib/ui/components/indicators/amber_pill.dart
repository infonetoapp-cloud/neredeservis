import 'package:flutter/material.dart';

import '../../tokens/color_tokens.dart';
import '../../tokens/radius_tokens.dart';
import '../../tokens/spacing_tokens.dart';
import 'amber_badge.dart';

class AmberPill extends StatelessWidget {
  const AmberPill({
    super.key,
    required this.label,
    this.tone = AmberBadgeTone.neutral,
    this.leading,
    this.onTap,
    this.selected = false,
  });

  final String label;
  final AmberBadgeTone tone;
  final IconData? leading;
  final VoidCallback? onTap;
  final bool selected;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final palette = _paletteFor(tone, selected);

    final content = Container(
      padding: AmberSpacingTokens.pillPadding,
      decoration: BoxDecoration(
        color: palette.background,
        borderRadius: AmberRadiusTokens.radius28,
        border: Border.all(color: palette.border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          if (leading != null) ...<Widget>[
            Icon(
              leading,
              size: 16,
              color: palette.foreground,
            ),
            const SizedBox(width: AmberSpacingTokens.space8),
          ],
          Text(
            label,
            style: textTheme.labelLarge?.copyWith(color: palette.foreground),
          ),
        ],
      ),
    );

    if (onTap == null) {
      return content;
    }

    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: AmberRadiusTokens.radius28,
        onTap: onTap,
        child: content,
      ),
    );
  }

  _AmberPillPalette _paletteFor(AmberBadgeTone tone, bool selected) {
    switch (tone) {
      case AmberBadgeTone.success:
        return _AmberPillPalette(
          background: selected ? AmberColorTokens.success : const Color(0x1F3DA66A),
          foreground: selected ? AmberColorTokens.surface0 : AmberColorTokens.success,
          border: selected ? AmberColorTokens.success : const Color(0x663DA66A),
        );
      case AmberBadgeTone.warning:
        return _AmberPillPalette(
          background: selected ? AmberColorTokens.amber500 : AmberColorTokens.amber100,
          foreground: selected ? AmberColorTokens.ink900 : AmberColorTokens.amber500,
          border: selected ? AmberColorTokens.amber500 : const Color(0x66E8760A),
        );
      case AmberBadgeTone.danger:
        return _AmberPillPalette(
          background: selected ? AmberColorTokens.danger : const Color(0x1FD64E45),
          foreground: AmberColorTokens.surface0,
          border: selected ? AmberColorTokens.danger : const Color(0x66D64E45),
        );
      case AmberBadgeTone.neutral:
        return _AmberPillPalette(
          background: selected ? AmberColorTokens.ink900 : AmberColorTokens.surface0,
          foreground: selected ? AmberColorTokens.surface0 : AmberColorTokens.ink700,
          border: selected ? AmberColorTokens.ink900 : AmberColorTokens.line200,
        );
    }
  }
}

class _AmberPillPalette {
  _AmberPillPalette({
    required this.background,
    required this.foreground,
    required this.border,
  });

  final Color background;
  final Color foreground;
  final Color border;
}
