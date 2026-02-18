import 'package:flutter/material.dart';

import '../components/buttons/amber_buttons.dart';
import '../tokens/color_tokens.dart';
import '../tokens/radius_tokens.dart';
import '../tokens/spacing_tokens.dart';

class AuthHeroLoginScreen extends StatelessWidget {
  const AuthHeroLoginScreen({
    super.key,
    required this.appName,
    this.heroImageAssetPath = 'assets/images/start.jpeg',
    this.onGoogleSignInTap,
    this.onSignInTap,
    this.onRegisterTap,
  });

  final String appName;
  final String heroImageAssetPath;
  final VoidCallback? onGoogleSignInTap;
  final VoidCallback? onSignInTap;
  final VoidCallback? onRegisterTap;

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
                      Color(0xFFF7F8F5),
                      Color(0xFFEFE3D4),
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
                  Color(0x33000000),
                  Color(0xA6101413),
                ],
              ),
            ),
          ),
          SafeArea(
            child: Padding(
              padding: AmberSpacingTokens.screenPadding,
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
                            color: AmberColorTokens.surface0,
                          ),
                        ),
                        const Spacer(),
                        Container(
                          padding: const EdgeInsets.all(
                            AmberSpacingTokens.space20,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xCC101413),
                            borderRadius: AmberRadiusTokens.radius20,
                            border: Border.all(
                              color: const Color(0x33FFFFFF),
                            ),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            mainAxisSize: MainAxisSize.min,
                            children: <Widget>[
                              Text(
                                'Yolculuk takibini tek noktadan yonet.',
                                style: textTheme.headlineSmall?.copyWith(
                                  color: AmberColorTokens.surface0,
                                ),
                              ),
                              const SizedBox(
                                height: AmberSpacingTokens.space8,
                              ),
                              Text(
                                'Hemen giris yap ve servis akisini amber UI ile devam ettir.',
                                style: textTheme.bodyMedium?.copyWith(
                                  color: const Color(0xD9FFFFFF),
                                ),
                              ),
                              const SizedBox(
                                height: AmberSpacingTokens.space20,
                              ),
                              AmberPrimaryButton(
                                label: 'Giris Yap',
                                onPressed: onSignInTap,
                              ),
                              const SizedBox(
                                height: AmberSpacingTokens.space12,
                              ),
                              AmberSecondaryButton(
                                label: 'Google ile Giris',
                                onPressed: onGoogleSignInTap,
                                isOnDarkSurface: true,
                              ),
                              const SizedBox(
                                height: AmberSpacingTokens.space8,
                              ),
                              TextButton(
                                onPressed: onRegisterTap,
                                child: const Text('Hesabin yok mu? Uye ol'),
                              ),
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
