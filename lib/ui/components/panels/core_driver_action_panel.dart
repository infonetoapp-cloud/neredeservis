import 'package:flutter/material.dart';

import '../../tokens/core_colors.dart';
import '../../tokens/core_elevations.dart';
import '../../tokens/core_radii.dart';
import '../../tokens/core_spacing.dart';
import '../../tokens/cta_tokens.dart';
import '../../tokens/icon_tokens.dart';
import '../buttons/core_buttons.dart';

class CoreDriverActionPanel extends StatelessWidget {
  const CoreDriverActionPanel({
    super.key,
    required this.isTripActive,
    required this.onPrimaryAction,
    this.onSecondaryAction,
    this.onAnnouncementTap,
    this.primaryLabel,
    this.secondaryLabel,
  });

  final bool isTripActive;
  final VoidCallback? onPrimaryAction;
  final VoidCallback? onSecondaryAction;
  final VoidCallback? onAnnouncementTap;
  final String? primaryLabel;
  final String? secondaryLabel;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;

    return Container(
      padding: const EdgeInsets.all(CoreSpacing.space16),
      decoration: const BoxDecoration(
        color: CoreColors.surface0,
        borderRadius: CoreRadii.radius20,
        boxShadow: CoreElevations.shadowLevel1,
        border: Border.fromBorderSide(
          BorderSide(color: CoreColors.line200),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text(
            isTripActive ? 'Aktif sefer paneli' : 'Sefer başlatma paneli',
            style: textTheme.titleMedium,
          ),
          const SizedBox(height: CoreSpacing.space4),
          Text(
            isTripActive
                ? 'Güvenli bitiş için kontrollü aksiyon kullan.'
                : 'Operasyon esnasında tek bir birincil aksiyona odaklan.',
            style: textTheme.bodySmall?.copyWith(
              color: CoreColors.ink700,
            ),
          ),
          const SizedBox(height: CoreSpacing.space12),
          if (isTripActive)
            CoreDangerButton(
              label: primaryLabel ?? CoreCtaTokens.finishTrip,
              onPressed: onPrimaryAction,
            )
          else
            CorePrimaryButton(
              label: primaryLabel ?? CoreCtaTokens.startTrip,
              onPressed: onPrimaryAction,
            ),
          if (secondaryLabel != null && onSecondaryAction != null) ...<Widget>[
            const SizedBox(height: CoreSpacing.space12),
            CoreSecondaryButton(
              label: secondaryLabel!,
              onPressed: onSecondaryAction,
            ),
          ],
          if (onAnnouncementTap != null) ...<Widget>[
            const SizedBox(height: CoreSpacing.space8),
            TextButton.icon(
              onPressed: onAnnouncementTap,
              icon: const Icon(CoreIconTokens.megaphone),
              label: const Text('Duyuru Gönder'),
            ),
          ],
        ],
      ),
    );
  }
}
