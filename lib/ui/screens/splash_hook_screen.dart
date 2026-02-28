import 'package:flutter/material.dart';

import '../components/buttons/core_buttons.dart';
import '../tokens/core_colors.dart';
import '../tokens/core_radii.dart';
import '../tokens/core_spacing.dart';
import '../tokens/cta_tokens.dart';
import '../tokens/icon_tokens.dart';

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
              padding: CoreSpacing.screenPadding,
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
                  const SizedBox(height: CoreSpacing.space8),
                  _VideoReadyPosterShell(
                    posterAssetPath: posterAssetPath,
                    policy: policy,
                  ),
                  const SizedBox(height: CoreSpacing.space20),
                  Text(
                    'Servis nerede? Tek bakışta.',
                    style: textTheme.headlineSmall,
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: CoreSpacing.space8),
                  Text(
                    'Şoför yayınını açınca yolcu tek ekranda ETA ve konumu görür.',
                    style: textTheme.bodyMedium?.copyWith(
                      color: CoreColors.ink700,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: CoreSpacing.space16),
                  Text(
                    policy.debugLabel,
                    key: const Key('splash_policy_label'),
                    style: textTheme.bodySmall?.copyWith(
                      color: CoreColors.ink700,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: CoreSpacing.space24),
                  CorePrimaryButton(
                    label: CoreCtaTokens.continueLabel,
                    onPressed: onContinueTap,
                  ),
                  const SizedBox(height: CoreSpacing.space12),
                  Text(
                    'Splash / Router İskeleti ($flavorLabel)',
                    textAlign: TextAlign.center,
                    style: textTheme.bodySmall?.copyWith(
                      color: CoreColors.ink700,
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
        borderRadius: CoreRadii.radius20,
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
              left: CoreSpacing.space12,
              right: CoreSpacing.space12,
              bottom: CoreSpacing.space12,
              child: Row(
                children: <Widget>[
                  const Icon(
                    CoreIconTokens.mute,
                    size: 16,
                    color: CoreColors.surface0,
                  ),
                  const SizedBox(width: CoreSpacing.space8),
                  Expanded(
                    child: Text(
                      policy.videoHint,
                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
                            color: CoreColors.surface0,
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
            CoreIconTokens.playCircle,
            size: 48,
            color: CoreColors.amber500,
          ),
          const SizedBox(height: CoreSpacing.space8),
          Text(
            'Video hazır değil, poster modunda devam.',
            style: Theme.of(context).textTheme.labelMedium?.copyWith(
                  color: CoreColors.ink900,
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
      return 'Hızlı geçiş modu aktif.';
    }
      return 'Autoplay sessiz, ilk açılışta max $maxLoopsFirstOpen döngü.';
  }

  String get videoHint {
    if (quickTransition) {
      return 'Sonraki açılışlarda hızlı geçiş.';
    }
    return 'İlk açılış politikası: sessiz autoplay, max 1 döngü.';
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
