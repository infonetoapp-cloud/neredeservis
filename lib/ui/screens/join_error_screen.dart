import 'package:flutter/material.dart';

import '../components/buttons/black_action_button.dart';

class JoinErrorScreen extends StatelessWidget {
  const JoinErrorScreen({
    super.key,
    required this.title,
    required this.description,
    required this.primaryCtaLabel,
    this.secondaryCtaLabel,
    this.onPrimaryTap,
    this.onSecondaryTap,
    this.onBackTap,
  });

  final String title;
  final String description;
  final String primaryCtaLabel;
  final String? secondaryCtaLabel;
  final VoidCallback? onPrimaryTap;
  final VoidCallback? onSecondaryTap;
  final VoidCallback? onBackTap;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF6F7F5),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: <Widget>[
              const SizedBox(height: 8),
              Align(
                alignment: Alignment.centerLeft,
                child: IconButton(
                  onPressed: onBackTap,
                  icon: const Icon(Icons.arrow_back_rounded),
                  color: const Color(0xFF1B1E1D),
                  style: IconButton.styleFrom(
                    backgroundColor: Colors.white,
                    shape: const CircleBorder(),
                  ),
                ),
              ),
              const Spacer(flex: 2),
              Center(
                child: Container(
                  width: 154,
                  height: 154,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                    boxShadow: <BoxShadow>[
                      BoxShadow(
                        color: Colors.black.withOpacity(0.06),
                        blurRadius: 24,
                        offset: const Offset(0, 10),
                      ),
                    ],
                  ),
                  child: const Icon(
                    Icons.wifi_off_rounded,
                    size: 76,
                    color: Color(0xFF0E0E0E),
                  ),
                ),
              ),
              const SizedBox(height: 34),
              Text(
                title,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: Color(0xFF1B1E1D),
                  fontSize: 32,
                  fontWeight: FontWeight.w700,
                  height: 1.05,
                ),
              ),
              const SizedBox(height: 14),
              Text(
                description,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: Color(0xFF6B6F6D),
                  fontSize: 17,
                  height: 1.34,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const Spacer(flex: 3),
              BlackPrimaryButton(
                label: primaryCtaLabel,
                onPressed: onPrimaryTap,
                trailingIcon: Icons.refresh_rounded,
              ),
              if (secondaryCtaLabel != null) ...<Widget>[
                const SizedBox(height: 12),
                TextButton(
                  onPressed: onSecondaryTap,
                  style: TextButton.styleFrom(
                    foregroundColor: const Color(0xFF1B1E1D),
                    textStyle: const TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 17,
                    ),
                  ),
                  child: Text(secondaryCtaLabel!),
                ),
              ],
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }
}
