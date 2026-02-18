import 'package:flutter/material.dart';

import '../../tokens/color_tokens.dart';
import '../../tokens/cta_tokens.dart';
import '../../tokens/icon_tokens.dart';
import '../../tokens/radius_tokens.dart';
import '../../tokens/spacing_tokens.dart';
import '../buttons/amber_buttons.dart';
import '../indicators/amber_status_chip.dart';

class AmberRouteCard extends StatelessWidget {
  const AmberRouteCard({
    super.key,
    required this.routeName,
    required this.metaLine,
    this.scheduleLabel,
    this.statusChip,
    this.primaryActionLabel = AmberCtaTokens.continueLabel,
    this.onPrimaryAction,
    this.onTap,
  });

  final String routeName;
  final String metaLine;
  final String? scheduleLabel;
  final AmberStatusChip? statusChip;
  final String primaryActionLabel;
  final VoidCallback? onPrimaryAction;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;

    final cardChild = Padding(
      padding: AmberSpacingTokens.cardPadding,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              const Icon(AmberIconTokens.bus, size: 20),
              const SizedBox(width: AmberSpacingTokens.space8),
              Expanded(
                child: Text(
                  routeName,
                  style: textTheme.titleMedium,
                ),
              ),
              if (statusChip != null) statusChip!,
            ],
          ),
          const SizedBox(height: AmberSpacingTokens.space8),
          Text(
            metaLine,
            style:
                textTheme.bodyMedium?.copyWith(color: AmberColorTokens.ink700),
          ),
          if (scheduleLabel != null) ...<Widget>[
            const SizedBox(height: AmberSpacingTokens.space8),
            Text(
              scheduleLabel!,
              style: textTheme.labelMedium
                  ?.copyWith(color: AmberColorTokens.ink700),
            ),
          ],
          const SizedBox(height: AmberSpacingTokens.space16),
          AmberPrimaryButton(
            label: primaryActionLabel,
            onPressed: onPrimaryAction,
          ),
        ],
      ),
    );

    return Card(
      child: InkWell(
        borderRadius: AmberRadiusTokens.radius20,
        onTap: onTap,
        child: cardChild,
      ),
    );
  }
}
