import 'package:flutter/material.dart';

import '../../tokens/color_tokens.dart';
import '../../tokens/elevation_tokens.dart';
import '../../tokens/radius_tokens.dart';
import '../../tokens/spacing_tokens.dart';
import '../buttons/amber_buttons.dart';

class AmberDriverActionPanel extends StatelessWidget {
  const AmberDriverActionPanel({
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
      padding: const EdgeInsets.all(AmberSpacingTokens.space16),
      decoration: const BoxDecoration(
        color: AmberColorTokens.surface0,
        borderRadius: AmberRadiusTokens.radius20,
        boxShadow: AmberElevationTokens.shadowLevel1,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text(
            isTripActive ? 'Aktif sefer paneli' : 'Sefer baslatma paneli',
            style: textTheme.titleMedium,
          ),
          const SizedBox(height: AmberSpacingTokens.space8),
          Text(
            isTripActive
                ? 'Canli yayin acik. Guvenli bitis icin kontrollu aksiyon kullan.'
                : 'Hazir oldugunda seferi baslat ve yolcu yayinini ac.',
            style: textTheme.bodyMedium?.copyWith(color: AmberColorTokens.ink700),
          ),
          const SizedBox(height: AmberSpacingTokens.space16),
          if (isTripActive)
            AmberDangerButton(
              label: primaryLabel ?? 'Seferi bitir',
              onPressed: onPrimaryAction,
            )
          else
            AmberPrimaryButton(
              label: primaryLabel ?? 'Seferi baslat',
              onPressed: onPrimaryAction,
            ),
          if (secondaryLabel != null && onSecondaryAction != null) ...<Widget>[
            const SizedBox(height: AmberSpacingTokens.space12),
            AmberSecondaryButton(
              label: secondaryLabel!,
              onPressed: onSecondaryAction,
            ),
          ],
          if (onAnnouncementTap != null) ...<Widget>[
            const SizedBox(height: AmberSpacingTokens.space8),
            TextButton.icon(
              onPressed: onAnnouncementTap,
              icon: const Icon(Icons.campaign_outlined),
              label: const Text('Duyuru gonder'),
            ),
          ],
        ],
      ),
    );
  }
}
