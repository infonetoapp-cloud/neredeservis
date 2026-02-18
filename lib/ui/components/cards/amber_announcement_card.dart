import 'package:flutter/material.dart';

import '../../tokens/color_tokens.dart';
import '../../tokens/icon_tokens.dart';
import '../../tokens/radius_tokens.dart';
import '../../tokens/spacing_tokens.dart';
import '../indicators/amber_badge.dart';

class AmberAnnouncementCard extends StatelessWidget {
  const AmberAnnouncementCard({
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
      child: InkWell(
        borderRadius: AmberRadiusTokens.radius20,
        onTap: onTap,
        child: Padding(
          padding: AmberSpacingTokens.cardPadding,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Row(
                children: <Widget>[
                  const Icon(AmberIconTokens.megaphone, size: 20),
                  const SizedBox(width: AmberSpacingTokens.space8),
                  Expanded(
                    child: Text(
                      title,
                      style: textTheme.titleMedium,
                    ),
                  ),
                  if (channelLabel != null)
                    AmberBadge(
                      label: channelLabel!,
                      tone: AmberBadgeTone.neutral,
                    ),
                ],
              ),
              const SizedBox(height: AmberSpacingTokens.space12),
              Text(
                message,
                style: textTheme.bodyMedium,
              ),
              const SizedBox(height: AmberSpacingTokens.space12),
              Text(
                sentAtLabel,
                style: textTheme.bodySmall?.copyWith(
                  color: AmberColorTokens.ink700,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
