import 'package:flutter/material.dart';

import '../../tokens/color_tokens.dart';
import '../../tokens/elevation_tokens.dart';
import '../../tokens/radius_tokens.dart';
import '../../tokens/spacing_tokens.dart';
import '../buttons/amber_buttons.dart';

class AmberBottomSheetTemplate extends StatelessWidget {
  const AmberBottomSheetTemplate({
    super.key,
    this.title,
    this.subtitle,
    required this.child,
    this.primaryActionLabel,
    this.onPrimaryAction,
    this.secondaryActionLabel,
    this.onSecondaryAction,
    this.showHandle = true,
  });

  final String? title;
  final String? subtitle;
  final Widget child;

  final String? primaryActionLabel;
  final VoidCallback? onPrimaryAction;
  final String? secondaryActionLabel;
  final VoidCallback? onSecondaryAction;

  final bool showHandle;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;

    return SafeArea(
      top: false,
      child: Container(
        decoration: const BoxDecoration(
          color: AmberColorTokens.surface0,
          borderRadius: BorderRadius.vertical(
            top: Radius.circular(AmberRadiusTokens.radius28Value),
          ),
          boxShadow: AmberElevationTokens.shadowLevel2,
        ),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(
            AmberSpacingTokens.space16,
            AmberSpacingTokens.space12,
            AmberSpacingTokens.space16,
            AmberSpacingTokens.space20,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              if (showHandle) ...<Widget>[
                Center(
                  child: Container(
                    width: 44,
                    height: 4,
                    decoration: BoxDecoration(
                      color: AmberColorTokens.line200,
                      borderRadius: BorderRadius.circular(999),
                    ),
                  ),
                ),
                const SizedBox(height: AmberSpacingTokens.space12),
              ],
              if (title != null) ...<Widget>[
                Text(
                  title!,
                  style: textTheme.titleLarge,
                ),
                const SizedBox(height: AmberSpacingTokens.space8),
              ],
              if (subtitle != null) ...<Widget>[
                Text(
                  subtitle!,
                  style: textTheme.bodyMedium?.copyWith(
                    color: AmberColorTokens.ink700,
                  ),
                ),
                const SizedBox(height: AmberSpacingTokens.space16),
              ],
              child,
              if (primaryActionLabel != null || secondaryActionLabel != null) ...<Widget>[
                const SizedBox(height: AmberSpacingTokens.space20),
                Row(
                  children: <Widget>[
                    if (secondaryActionLabel != null) ...<Widget>[
                      Expanded(
                        child: AmberSecondaryButton(
                          label: secondaryActionLabel!,
                          onPressed: onSecondaryAction,
                          fullWidth: false,
                        ),
                      ),
                      if (primaryActionLabel != null)
                        const SizedBox(width: AmberSpacingTokens.space12),
                    ],
                    if (primaryActionLabel != null)
                      Expanded(
                        child: AmberPrimaryButton(
                          label: primaryActionLabel!,
                          onPressed: onPrimaryAction,
                          fullWidth: false,
                        ),
                      ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

Future<T?> showAmberBottomSheet<T>({
  required BuildContext context,
  String? title,
  String? subtitle,
  required Widget child,
  String? primaryActionLabel,
  VoidCallback? onPrimaryAction,
  String? secondaryActionLabel,
  VoidCallback? onSecondaryAction,
  bool isScrollControlled = true,
  bool isDismissible = true,
}) {
  return showModalBottomSheet<T>(
    context: context,
    backgroundColor: Colors.transparent,
    isScrollControlled: isScrollControlled,
    isDismissible: isDismissible,
    builder: (BuildContext modalContext) {
      return AmberBottomSheetTemplate(
        title: title,
        subtitle: subtitle,
        primaryActionLabel: primaryActionLabel,
        onPrimaryAction: onPrimaryAction,
        secondaryActionLabel: secondaryActionLabel,
        onSecondaryAction: onSecondaryAction,
        child: child,
      );
    },
  );
}
