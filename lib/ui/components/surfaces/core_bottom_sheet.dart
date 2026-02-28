import 'package:flutter/material.dart';

import '../../tokens/core_colors.dart';
import '../../tokens/core_elevations.dart';
import '../../tokens/core_radii.dart';
import '../../tokens/core_spacing.dart';
import '../buttons/core_buttons.dart';

class CoreBottomSheetTemplate extends StatelessWidget {
  const CoreBottomSheetTemplate({
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
          color: CoreColors.surface0,
          borderRadius: BorderRadius.vertical(
            top: Radius.circular(CoreRadii.radius28Value),
          ),
          boxShadow: CoreElevations.shadowLevel2,
          border: Border.fromBorderSide(
            BorderSide(color: CoreColors.line200),
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(
            CoreSpacing.space16,
            CoreSpacing.space12,
            CoreSpacing.space16,
            CoreSpacing.space20,
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
                      color: CoreColors.line200,
                      borderRadius: BorderRadius.circular(999),
                    ),
                  ),
                ),
                const SizedBox(height: CoreSpacing.space12),
              ],
              if (title != null) ...<Widget>[
                Text(
                  title!,
                  style: textTheme.titleLarge,
                ),
                const SizedBox(height: CoreSpacing.space8),
              ],
              if (subtitle != null) ...<Widget>[
                Text(
                  subtitle!,
                  style: textTheme.bodyMedium?.copyWith(
                    color: CoreColors.ink700,
                  ),
                ),
                const SizedBox(height: CoreSpacing.space16),
              ],
              child,
              if (primaryActionLabel != null ||
                  secondaryActionLabel != null) ...<Widget>[
                const SizedBox(height: CoreSpacing.space20),
                Row(
                  children: <Widget>[
                    if (secondaryActionLabel != null) ...<Widget>[
                      Expanded(
                        child: CoreSecondaryButton(
                          label: secondaryActionLabel!,
                          onPressed: onSecondaryAction,
                          fullWidth: false,
                        ),
                      ),
                      if (primaryActionLabel != null)
                        const SizedBox(width: CoreSpacing.space12),
                    ],
                    if (primaryActionLabel != null)
                      Expanded(
                        child: CorePrimaryButton(
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

Future<T?> showCoreBottomSheet<T>({
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
      return CoreBottomSheetTemplate(
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
