import 'package:flutter/material.dart';

import '../../tokens/core_colors.dart';
import '../../tokens/core_spacing.dart';
import '../../tokens/icon_tokens.dart';
import '../buttons/core_buttons.dart';

class CoreEmptyState extends StatelessWidget {
  const CoreEmptyState({
    super.key,
    required this.title,
    required this.description,
    this.icon = CoreIconTokens.emptyState,
    this.actionLabel,
    this.onActionTap,
  });

  final String title;
  final String description;
  final IconData icon;
  final String? actionLabel;
  final VoidCallback? onActionTap;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(CoreSpacing.space24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            Icon(
              icon,
              size: 40,
              color: CoreColors.ink700,
            ),
            const SizedBox(height: CoreSpacing.space16),
            Text(
              title,
              textAlign: TextAlign.center,
              style: textTheme.titleMedium,
            ),
            const SizedBox(height: CoreSpacing.space8),
            Text(
              description,
              textAlign: TextAlign.center,
              style: textTheme.bodyMedium
                  ?.copyWith(color: CoreColors.ink700),
            ),
            if (actionLabel != null && onActionTap != null) ...<Widget>[
              const SizedBox(height: CoreSpacing.space20),
              CorePrimaryButton(
                label: actionLabel!,
                onPressed: onActionTap,
                fullWidth: false,
              ),
            ],
          ],
        ),
      ),
    );
  }
}
