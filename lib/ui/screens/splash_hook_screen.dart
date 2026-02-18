import 'package:flutter/material.dart';

import '../components/buttons/amber_buttons.dart';
import '../tokens/color_tokens.dart';
import '../tokens/cta_tokens.dart';
import '../tokens/icon_tokens.dart';
import '../tokens/radius_tokens.dart';
import '../tokens/spacing_tokens.dart';

class SplashHookScreen extends StatelessWidget {
  const SplashHookScreen({
    super.key,
    required this.appName,
    required this.flavorLabel,
    this.onContinueTap,
    this.onSkipTap,
    this.posterAssetPath,
  });

  final String appName;
  final String flavorLabel;
  final VoidCallback? onContinueTap;
  final VoidCallback? onSkipTap;
  final String? posterAssetPath;

  @override
  Widget build(BuildContext context) {
    final policy = SplashPlaybackPolicy.consume();
    final textTheme = Theme.of(context).textTheme;

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: <Color>[
              Color(0xFFFFF3E7),
              Color(0xFFF7F8F5),
            ],
          ),
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            child: Padding(
              padding: AmberSpacingTokens.screenPadding,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: <Widget>[
                  Align(
                    alignment: Alignment.center,
                    child: Row(
                      children: <Widget>[
                        Expanded(
                          child: Text(
                            appName,
                            style: textTheme.titleMedium,
                          ),
                        ),
                        TextButton(
                          onPressed: onSkipTap,
                          child: const Text('Atla'),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: AmberSpacingTokens.space8),
                  _VideoReadyPosterShell(
                    posterAssetPath: posterAssetPath,
                    policy: policy,
                  ),
                  const SizedBox(height: AmberSpacingTokens.space20),
                  Text(
                    'Servis nerede? Tek bakista.',
                    style: textTheme.headlineSmall,
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: AmberSpacingTokens.space8),
                  Text(
                    'Sofor yayinini acinca yolcu tek ekranda ETA ve konumu gorur.',
                    style: textTheme.bodyMedium?.copyWith(
                      color: AmberColorTokens.ink700,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: AmberSpacingTokens.space16),
                  Text(
                    policy.debugLabel,
                    key: const Key('splash_policy_label'),
                    style: textTheme.bodySmall?.copyWith(
                      color: AmberColorTokens.ink700,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: AmberSpacingTokens.space24),
                  AmberPrimaryButton(
                    label: AmberCtaTokens.continueLabel,
                    onPressed: onContinueTap,
                  ),
                  const SizedBox(height: AmberSpacingTokens.space12),
                  Text(
                    'Splash / Router Skeleton ($flavorLabel)',
                    textAlign: TextAlign.center,
                    style: textTheme.bodySmall?.copyWith(
                      color: AmberColorTokens.ink700,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _VideoReadyPosterShell extends StatelessWidget {
  const _VideoReadyPosterShell({
    required this.posterAssetPath,
    required this.policy,
  });

  final String? posterAssetPath;
  final SplashPlaybackPolicy policy;

  @override
  Widget build(BuildContext context) {
    return AspectRatio(
      aspectRatio: 16 / 9,
      child: ClipRRect(
        borderRadius: AmberRadiusTokens.radius20,
        child: Stack(
          fit: StackFit.expand,
          children: <Widget>[
            if (posterAssetPath != null)
              Image.asset(
                posterAssetPath!,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) {
                  return const _PosterFallback();
                },
              )
            else
              const _PosterFallback(),
            const DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.bottomCenter,
                  end: Alignment.topCenter,
                  colors: <Color>[
                    Color(0x99101413),
                    Color(0x00101413),
                  ],
                ),
              ),
            ),
            Positioned(
              left: AmberSpacingTokens.space12,
              right: AmberSpacingTokens.space12,
              bottom: AmberSpacingTokens.space12,
              child: Row(
                children: <Widget>[
                  const Icon(
                    AmberIconTokens.mute,
                    size: 16,
                    color: AmberColorTokens.surface0,
                  ),
                  const SizedBox(width: AmberSpacingTokens.space8),
                  Expanded(
                    child: Text(
                      policy.videoHint,
                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
                            color: AmberColorTokens.surface0,
                          ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PosterFallback extends StatelessWidget {
  const _PosterFallback();

  @override
  Widget build(BuildContext context) {
    return Container(
      color: const Color(0xFFFFE8D1),
      alignment: Alignment.center,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          const Icon(
            AmberIconTokens.playCircle,
            size: 48,
            color: AmberColorTokens.amber500,
          ),
          const SizedBox(height: AmberSpacingTokens.space8),
          Text(
            'Video hazir degil, poster modunda devam.',
            style: Theme.of(context).textTheme.labelMedium?.copyWith(
                  color: AmberColorTokens.ink900,
                ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

class SplashPlaybackPolicy {
  const SplashPlaybackPolicy._({
    required this.maxLoopsFirstOpen,
    required this.quickTransition,
  });

  final int maxLoopsFirstOpen;
  final bool quickTransition;

  String get debugLabel {
    if (quickTransition) {
      return 'Hizli gecis modu aktif.';
    }
    return 'Autoplay sessiz, ilk acilista max $maxLoopsFirstOpen dongu.';
  }

  String get videoHint {
    if (quickTransition) {
      return 'Sonraki acilislarda hizli gecis.';
    }
    return 'Ilk acilis politikasi: sessiz autoplay, max 1 dongu.';
  }

  static bool _firstOpenConsumed = false;

  static SplashPlaybackPolicy consume() {
    if (_firstOpenConsumed) {
      return const SplashPlaybackPolicy._(
        maxLoopsFirstOpen: 0,
        quickTransition: true,
      );
    }
    _firstOpenConsumed = true;
    return const SplashPlaybackPolicy._(
      maxLoopsFirstOpen: 1,
      quickTransition: false,
    );
  }

  @visibleForTesting
  static void resetForTest() {
    _firstOpenConsumed = false;
  }
}
