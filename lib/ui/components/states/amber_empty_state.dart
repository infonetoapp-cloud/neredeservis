import 'package:flutter/material.dart';

import '../../tokens/color_tokens.dart';
import '../../tokens/icon_tokens.dart';
import '../../tokens/spacing_tokens.dart';
import '../buttons/amber_buttons.dart';

class AmberEmptyState extends StatelessWidget {
  const AmberEmptyState({
    super.key,
    required this.title,
    required this.description,
    this.icon = AmberIconTokens.emptyState,
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
        padding: const EdgeInsets.all(AmberSpacingTokens.space24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            Icon(
              icon,
              size: 40,
              color: AmberColorTokens.ink700,
            ),
            const SizedBox(height: AmberSpacingTokens.space16),
            Text(
              title,
              textAlign: TextAlign.center,
              style: textTheme.titleMedium,
            ),
            const SizedBox(height: AmberSpacingTokens.space8),
            Text(
              description,
              textAlign: TextAlign.center,
              style: textTheme.bodyMedium
                  ?.copyWith(color: AmberColorTokens.ink700),
            ),
            if (actionLabel != null && onActionTap != null) ...<Widget>[
              const SizedBox(height: AmberSpacingTokens.space20),
              AmberPrimaryButton(
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
