import 'package:flutter/material.dart';

import '../components/buttons/core_buttons.dart';
import '../tokens/core_colors.dart';
import '../tokens/core_radii.dart';
import '../tokens/core_spacing.dart';

class AuthHeroLoginScreen extends StatelessWidget {
  const AuthHeroLoginScreen({
    super.key,
    required this.appName,
    this.heroImageAssetPath = 'assets/images/logo.png',
    this.continueHint,
    this.onGoogleSignInTap,
    this.onSignInTap,
    this.onRegisterTap,
    this.onTestGuestTap,
  });

  final String appName;
  final String heroImageAssetPath;
  final String? continueHint;
  final VoidCallback? onGoogleSignInTap;
  final VoidCallback? onSignInTap;
  final VoidCallback? onRegisterTap;
  final VoidCallback? onTestGuestTap;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;

    return Scaffold(
      body: Stack(
        fit: StackFit.expand,
        children: <Widget>[
          Image.asset(
            heroImageAssetPath,
            fit: BoxFit.cover,
            errorBuilder: (context, error, stackTrace) {
              return const DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: <Color>[
                      Color(0xFFEAF8F2),
                      Color(0xFFDCEEE6),
                    ],
                  ),
                ),
              );
            },
          ),
          const DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: <Color>[
                  Color(0x220A1411),
                  Color(0xCC0A1411),
                ],
              ),
            ),
          ),
          SafeArea(
            child: Padding(
              padding: CoreSpacing.screenPadding,
              child: CustomScrollView(
                slivers: <Widget>[
                  SliverFillRemaining(
                    hasScrollBody: false,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: <Widget>[
                        Text(
                          appName,
                          style: textTheme.titleLarge?.copyWith(
                            color: CoreColors.surface0,
                          ),
                        ),
                        const Spacer(),
                        Container(
                          padding: const EdgeInsets.all(
                            CoreSpacing.space20,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xBC0B151D),
                            borderRadius: CoreRadii.radius20,
                            border: Border.all(
                              color: const Color(0x4DFFFFFF),
                            ),
                            boxShadow: const <BoxShadow>[
                              BoxShadow(
                                color: Color(0x4A000000),
                                blurRadius: 24,
                                offset: Offset(0, 10),
                              ),
                            ],
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            mainAxisSize: MainAxisSize.min,
                            children: <Widget>[
                              Text(
                                'Yolculuk takibini tek noktadan yönet.',
                                style: textTheme.headlineSmall?.copyWith(
                                  color: CoreColors.surface0,
                                ),
                              ),
                              if (continueHint != null &&
                                  continueHint!.trim().isNotEmpty) ...<Widget>[
                                const SizedBox(
                                  height: CoreSpacing.space8,
                                ),
                                Text(
                                  continueHint!,
                                  style: textTheme.bodyMedium?.copyWith(
                                    color: const Color(0xE6FFFFFF),
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ],
                              const SizedBox(
                                height: CoreSpacing.space8,
                              ),
                              Text(
                                'Hemen giriş yap ve servis akışını sade premium arayüzle devam ettir.',
                                style: textTheme.bodyMedium?.copyWith(
                                  color: const Color(0xD9FFFFFF),
                                ),
                              ),
                              const SizedBox(
                                height: CoreSpacing.space20,
                              ),
                              CorePrimaryButton(
                                label: 'Email ile Giriş',
                                onPressed: onSignInTap,
                              ),
                              const SizedBox(
                                height: CoreSpacing.space12,
                              ),
                              CoreSecondaryButton(
                                label: 'Email ile Üye Ol',
                                onPressed: onRegisterTap,
                                isOnDarkSurface: true,
                              ),
                              const SizedBox(
                                height: CoreSpacing.space8,
                              ),
                              CoreSecondaryButton(
                                label: 'Google ile Giriş',
                                onPressed: onGoogleSignInTap,
                                isOnDarkSurface: true,
                              ),
                              if (onTestGuestTap != null) ...<Widget>[
                                const SizedBox(
                                  height: CoreSpacing.space8,
                                ),
                                TextButton(
                                  onPressed: onTestGuestTap,
                                  child: const Text(
                                    'Teste Gir (Misafir)',
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
