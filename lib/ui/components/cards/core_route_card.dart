import 'package:flutter/material.dart';

import '../../tokens/core_colors.dart';
import '../../tokens/core_radii.dart';
import '../../tokens/core_spacing.dart';
import '../../tokens/cta_tokens.dart';
import '../../tokens/icon_tokens.dart';
import '../buttons/core_buttons.dart';
import '../indicators/core_status_chip.dart';

class CoreRouteCard extends StatelessWidget {
  const CoreRouteCard({
    super.key,
    required this.routeName,
    required this.metaLine,
    this.scheduleLabel,
    this.statusChip,
    this.primaryActionLabel = CoreCtaTokens.continueLabel,
    this.onPrimaryAction,
    this.onTap,
  });

  final String routeName;
  final String metaLine;
  final String? scheduleLabel;
  final CoreStatusChip? statusChip;
  final String primaryActionLabel;
  final VoidCallback? onPrimaryAction;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;

    final cardChild = Padding(
      padding: CoreSpacing.cardPadding,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Container(
                width: 34,
                height: 34,
                decoration: const BoxDecoration(
                  color: CoreColors.amber100,
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  CoreIconTokens.bus,
                  size: 18,
                  color: CoreColors.amber500,
                ),
              ),
              const SizedBox(width: CoreSpacing.space8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Text(
                      routeName,
                      style: textTheme.titleMedium,
                    ),
                    const SizedBox(height: CoreSpacing.space4),
                    Text(
                      metaLine,
                      style: textTheme.bodyMedium?.copyWith(
                        color: CoreColors.ink700,
                      ),
                    ),
                  ],
                ),
              ),
              if (statusChip != null) statusChip!,
            ],
          ),
          if (scheduleLabel != null) ...<Widget>[
            const SizedBox(height: CoreSpacing.space12),
            Container(
              padding: const EdgeInsets.symmetric(
                horizontal: CoreSpacing.space10,
                vertical: CoreSpacing.space8,
              ),
              decoration: const BoxDecoration(
                color: CoreColors.surface50,
                borderRadius: BorderRadius.all(
                  Radius.circular(12),
                ),
              ),
              child: Text(
                'Planlanan kalkis: $scheduleLabel',
                style: textTheme.labelMedium?.copyWith(
                  color: CoreColors.ink700,
                ),
              ),
            ),
          ],
          const SizedBox(height: CoreSpacing.space16),
          CorePrimaryButton(
            label: primaryActionLabel,
            onPressed: onPrimaryAction,
          ),
        ],
      ),
    );

    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        borderRadius: CoreRadii.radius20,
        onTap: onTap,
        child: cardChild,
      ),
    );
  }
}
