import 'package:flutter/material.dart';

import '../../tokens/core_spacing.dart';
import '../../tokens/core_typography.dart';

class CorePrimaryButton extends StatelessWidget {
  const CorePrimaryButton({
    super.key,
    required this.label,
    this.onPressed,
    this.fullWidth = true,
  });

  final String label;
  final VoidCallback? onPressed;
  final bool fullWidth;

  static ButtonStyle themeStyle() {
    return FilledButton.styleFrom(
      padding: const EdgeInsets.symmetric(
        horizontal: CoreSpacing.space20,
        vertical: CoreSpacing.space12,
      ),
      minimumSize: const Size(44, 56),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.all(Radius.circular(24)),
      ),
      textStyle: const TextStyle(
        fontFamily: CoreTypography.bodyFamily,
        fontWeight: FontWeight.w700,
        fontSize: 17,
      ),
    ).copyWith(
      backgroundColor: WidgetStateProperty.resolveWith<Color?>((states) {
        if (states.contains(WidgetState.disabled)) {
          return const Color(0xFFC7C9C6);
        }
        if (states.contains(WidgetState.pressed)) {
          return const Color(0xFF1A1A1A);
        }
        return const Color(0xFF0E0E0E);
      }),
      foregroundColor: WidgetStateProperty.resolveWith<Color?>((states) {
        if (states.contains(WidgetState.disabled)) {
          return const Color(0xFF6B6F6D);
        }
        return Colors.white;
      }),
      overlayColor: WidgetStateProperty.resolveWith<Color?>((states) {
        if (states.contains(WidgetState.pressed)) {
          return const Color(0x18FFFFFF);
        }
        if (states.contains(WidgetState.focused) ||
            states.contains(WidgetState.hovered)) {
          return const Color(0x10FFFFFF);
        }
        return null;
      }),
      elevation: WidgetStateProperty.resolveWith<double>((states) {
        if (states.contains(WidgetState.disabled) ||
            states.contains(WidgetState.pressed)) {
          return 0;
        }
        return 1;
      }),
      shadowColor: const WidgetStatePropertyAll<Color>(Color(0x24000000)),
    );
  }

  @override
  Widget build(BuildContext context) {
    final button = FilledButton(
      onPressed: onPressed,
      style: themeStyle(),
      child: Text(label),
    );

    if (!fullWidth) {
      return button;
    }

    return SizedBox(
      width: double.infinity,
      child: button,
    );
  }
}

class CoreSecondaryButton extends StatelessWidget {
  const CoreSecondaryButton({
    super.key,
    required this.label,
    this.onPressed,
    this.fullWidth = true,
    this.isOnDarkSurface = false,
  });

  final String label;
  final VoidCallback? onPressed;
  final bool fullWidth;
  final bool isOnDarkSurface;

  static ButtonStyle themeStyle() {
    return OutlinedButton.styleFrom(
      foregroundColor: Colors.white,
      side: const BorderSide(color: Color(0xFF0E0E0E)),
      backgroundColor: const Color(0xFF0E0E0E),
      padding: const EdgeInsets.symmetric(
        horizontal: CoreSpacing.space20,
        vertical: CoreSpacing.space12,
      ),
      minimumSize: const Size(44, 56),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.all(Radius.circular(24)),
      ),
      textStyle: const TextStyle(
        fontFamily: CoreTypography.bodyFamily,
        fontWeight: FontWeight.w700,
        fontSize: 16,
      ),
    ).copyWith(
      overlayColor: WidgetStateProperty.resolveWith<Color?>((states) {
        if (states.contains(WidgetState.pressed)) {
          return const Color(0x18FFFFFF);
        }
        if (states.contains(WidgetState.focused) ||
            states.contains(WidgetState.hovered)) {
          return const Color(0x10FFFFFF);
        }
        return null;
      }),
      backgroundColor: WidgetStateProperty.resolveWith<Color?>((states) {
        if (states.contains(WidgetState.disabled)) {
          return const Color(0xFFC7C9C6);
        }
        if (states.contains(WidgetState.pressed)) {
          return const Color(0xFF1A1A1A);
        }
        return const Color(0xFF0E0E0E);
      }),
      foregroundColor: WidgetStateProperty.resolveWith<Color?>((states) {
        if (states.contains(WidgetState.disabled)) {
          return const Color(0xFF6B6F6D);
        }
        return Colors.white;
      }),
      side: WidgetStateProperty.resolveWith<BorderSide?>((states) {
        if (states.contains(WidgetState.disabled)) {
          return const BorderSide(color: Color(0xFFC7C9C6), width: 1.2);
        }
        if (states.contains(WidgetState.pressed)) {
          return const BorderSide(color: Color(0xFF1A1A1A), width: 1.2);
        }
        return const BorderSide(color: Color(0xFF0E0E0E), width: 1.2);
      }),
      shadowColor: const WidgetStatePropertyAll<Color>(Color(0x24000000)),
      elevation: const WidgetStatePropertyAll<double>(1),
    );
  }

  ButtonStyle _onDarkSurfaceStyle() {
    return themeStyle().copyWith(
      side: WidgetStateProperty.resolveWith<BorderSide?>((states) {
        if (states.contains(WidgetState.disabled)) {
          return const BorderSide(color: Color(0x66C7C9C6), width: 1.2);
        }
        if (states.contains(WidgetState.pressed)) {
          return const BorderSide(color: Color(0x99FFFFFF), width: 1.2);
        }
        return const BorderSide(color: Color(0x66FFFFFF), width: 1.2);
      }),
      backgroundColor: WidgetStateProperty.resolveWith<Color?>((states) {
        if (states.contains(WidgetState.disabled)) {
          return const Color(0x66C7C9C6);
        }
        if (states.contains(WidgetState.pressed)) {
          return const Color(0xFF1A1A1A);
        }
        return const Color(0xFF0E0E0E);
      }),
      foregroundColor: const WidgetStatePropertyAll<Color>(Colors.white),
    );
  }

  @override
  Widget build(BuildContext context) {
    final button = OutlinedButton(
      onPressed: onPressed,
      style: isOnDarkSurface ? _onDarkSurfaceStyle() : themeStyle(),
      child: Text(label),
    );

    if (!fullWidth) {
      return button;
    }

    return SizedBox(
      width: double.infinity,
      child: button,
    );
  }
}

class CoreDangerButton extends StatelessWidget {
  const CoreDangerButton({
    super.key,
    required this.label,
    this.onPressed,
    this.fullWidth = true,
  });

  final String label;
  final VoidCallback? onPressed;
  final bool fullWidth;

  static ButtonStyle themeStyle() {
    return FilledButton.styleFrom(
      padding: const EdgeInsets.symmetric(
        horizontal: CoreSpacing.space20,
        vertical: CoreSpacing.space12,
      ),
      minimumSize: const Size(44, 56),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.all(Radius.circular(24)),
      ),
      textStyle: const TextStyle(
        fontFamily: CoreTypography.bodyFamily,
        fontWeight: FontWeight.w700,
        fontSize: 17,
      ),
    ).copyWith(
      backgroundColor: WidgetStateProperty.resolveWith<Color?>((states) {
        if (states.contains(WidgetState.disabled)) {
          return const Color(0xFFC7C9C6);
        }
        if (states.contains(WidgetState.pressed)) {
          return const Color(0xFF1A1A1A);
        }
        return const Color(0xFF0E0E0E);
      }),
      foregroundColor: WidgetStateProperty.resolveWith<Color?>((states) {
        if (states.contains(WidgetState.disabled)) {
          return const Color(0xFF6B6F6D);
        }
        return Colors.white;
      }),
      overlayColor: WidgetStateProperty.resolveWith<Color?>((states) {
        if (states.contains(WidgetState.pressed)) {
          return const Color(0x18FFFFFF);
        }
        return null;
      }),
      elevation: WidgetStateProperty.resolveWith<double>((states) {
        if (states.contains(WidgetState.disabled) ||
            states.contains(WidgetState.pressed)) {
          return 0;
        }
        return 1;
      }),
      shadowColor: const WidgetStatePropertyAll<Color>(Color(0x24000000)),
    );
  }

  @override
  Widget build(BuildContext context) {
    final button = FilledButton(
      onPressed: onPressed,
      style: themeStyle(),
      child: Text(label),
    );

    if (!fullWidth) {
      return button;
    }

    return SizedBox(
      width: double.infinity,
      child: button,
    );
  }
}
