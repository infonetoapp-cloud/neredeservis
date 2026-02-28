import 'package:flutter/material.dart';

import '../../tokens/core_colors.dart';
import '../../tokens/core_radii.dart';
import '../../tokens/core_spacing.dart';
import 'core_badge.dart';

class CorePill extends StatelessWidget {
  const CorePill({
    super.key,
    required this.label,
    this.tone = CoreBadgeTone.neutral,
    this.leading,
    this.onTap,
    this.selected = false,
  });

  final String label;
  final CoreBadgeTone tone;
  final IconData? leading;
  final VoidCallback? onTap;
  final bool selected;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final palette = _paletteFor(tone, selected);

    final content = Container(
      padding: CoreSpacing.pillPadding,
      decoration: BoxDecoration(
        color: palette.background,
        borderRadius: CoreRadii.radius28,
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
            const SizedBox(width: CoreSpacing.space8),
          ],
          Text(
            label,
            style: textTheme.labelLarge?.copyWith(
              color: palette.foreground,
              fontWeight: FontWeight.w700,
            ),
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
        borderRadius: CoreRadii.radius28,
        onTap: onTap,
        child: content,
      ),
    );
  }

  _CorePillPalette _paletteFor(CoreBadgeTone tone, bool selected) {
    switch (tone) {
      case CoreBadgeTone.success:
        return _CorePillPalette(
          background:
              selected ? CoreColors.success : const Color(0x1F3DA66A),
          foreground:
              selected ? CoreColors.surface0 : CoreColors.success,
          border: selected ? CoreColors.success : const Color(0x663DA66A),
        );
      case CoreBadgeTone.warning:
        return _CorePillPalette(
          background: selected
              ? CoreColors.warningStrong
              : CoreColors.amber100,
          foreground:
              selected ? CoreColors.surface0 : CoreColors.warning,
          border: selected
              ? CoreColors.warningStrong
              : const Color(0x668A5F00),
        );
      case CoreBadgeTone.danger:
        return _CorePillPalette(
          background:
              selected ? CoreColors.danger : const Color(0x1FD64E45),
          foreground: CoreColors.surface0,
          border: selected ? CoreColors.danger : const Color(0x66D64E45),
        );
      case CoreBadgeTone.neutral:
        return _CorePillPalette(
          background:
              selected ? CoreColors.ink900 : CoreColors.surface0,
          foreground:
              selected ? CoreColors.surface0 : CoreColors.ink700,
          border: selected ? CoreColors.ink900 : CoreColors.line200,
        );
    }
  }
}

class _CorePillPalette {
  _CorePillPalette({
    required this.background,
    required this.foreground,
    required this.border,
  });

  final Color background;
  final Color foreground;
  final Color border;
}
