import 'package:flutter/material.dart';

class BlackPrimaryButton extends StatelessWidget {
  const BlackPrimaryButton({
    super.key,
    required this.label,
    this.onPressed,
    this.trailingIcon,
  });

  final String label;
  final VoidCallback? onPressed;
  final IconData? trailingIcon;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: FilledButton(
        onPressed: onPressed,
        style: FilledButton.styleFrom(
          minimumSize: const Size(44, 56),
          shape: const RoundedRectangleBorder(
            borderRadius: BorderRadius.all(Radius.circular(26)),
          ),
          backgroundColor: const Color(0xFF0E0E0E),
          foregroundColor: Colors.white,
          textStyle: const TextStyle(
            fontWeight: FontWeight.w700,
            fontSize: 18,
            height: 1.2,
          ),
        ).copyWith(
          backgroundColor: WidgetStateProperty.resolveWith<Color?>((states) {
            if (states.contains(WidgetState.disabled)) {
              return const Color(0xFF9A9A9A);
            }
            if (states.contains(WidgetState.pressed)) {
              return const Color(0xFF1A1A1A);
            }
            return const Color(0xFF0E0E0E);
          }),
          overlayColor: const WidgetStatePropertyAll<Color>(
            Color(0x18FFFFFF),
          ),
          shadowColor: const WidgetStatePropertyAll<Color>(Color(0x24000000)),
          elevation: const WidgetStatePropertyAll<double>(1.2),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: <Widget>[
            Text(label),
            if (trailingIcon != null) ...<Widget>[
              const SizedBox(width: 8),
              Icon(trailingIcon, size: 18),
            ],
          ],
        ),
      ),
    );
  }
}

class BlackOutlineButton extends StatelessWidget {
  const BlackOutlineButton({
    super.key,
    required this.label,
    this.onPressed,
    this.icon,
  });

  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: OutlinedButton(
        onPressed: onPressed,
        style: OutlinedButton.styleFrom(
          minimumSize: const Size(44, 56),
          side: const BorderSide(
            color: Color(0xFF0E0E0E),
            width: 1.2,
          ),
          shape: const RoundedRectangleBorder(
            borderRadius: BorderRadius.all(Radius.circular(26)),
          ),
          foregroundColor: const Color(0xFF0E0E0E),
          backgroundColor: Colors.white,
          textStyle: const TextStyle(
            fontWeight: FontWeight.w700,
            fontSize: 17,
            height: 1.2,
          ),
        ).copyWith(
          overlayColor: const WidgetStatePropertyAll<Color>(
            Color(0x12000000),
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: <Widget>[
            if (icon != null) ...<Widget>[
              Icon(icon, size: 17),
              const SizedBox(width: 8),
            ],
            Text(label),
          ],
        ),
      ),
    );
  }
}
