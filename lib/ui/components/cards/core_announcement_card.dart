import 'package:flutter/material.dart';

import '../../tokens/core_colors.dart';
import '../../tokens/core_radii.dart';
import '../../tokens/core_spacing.dart';
import '../../tokens/icon_tokens.dart';
import '../indicators/core_badge.dart';

class CoreAnnouncementCard extends StatelessWidget {
  const CoreAnnouncementCard({
    super.key,
    required this.title,
    required this.message,
    required this.sentAtLabel,
    this.channelLabel,
    this.onTap,
  });

  final String title;
  final String message;
  final String sentAtLabel;
  final String? channelLabel;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;

    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        borderRadius: CoreRadii.radius20,
        onTap: onTap,
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Container(
              width: 4,
              color: CoreColors.amber500,
            ),
            Expanded(
              child: Padding(
                padding: CoreSpacing.cardPadding,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Row(
                      children: <Widget>[
                        Container(
                          width: 30,
                          height: 30,
                          decoration: const BoxDecoration(
                            color: CoreColors.amber100,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            CoreIconTokens.megaphone,
                            size: 16,
                            color: CoreColors.amber500,
                          ),
                        ),
                        const SizedBox(width: CoreSpacing.space8),
                        Expanded(
                          child: Text(
                            title,
                            style: textTheme.titleMedium,
                          ),
                        ),
                        if (channelLabel != null)
                          CoreBadge(
                            label: channelLabel!,
                            tone: CoreBadgeTone.neutral,
                          ),
                      ],
                    ),
                    const SizedBox(height: CoreSpacing.space12),
                    Text(
                      message,
                      style: textTheme.bodyMedium,
                    ),
                    const SizedBox(height: CoreSpacing.space12),
                    Text(
                      sentAtLabel,
                      style: textTheme.bodySmall?.copyWith(
                        color: CoreColors.ink500,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
