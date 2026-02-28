import 'package:flutter/material.dart';

class ForceUpdateRequiredScreen extends StatelessWidget {
  const ForceUpdateRequiredScreen({
    super.key,
    required this.appName,
    required this.onUpdateTap,
  });

  final String appName;
  final Future<void> Function() onUpdateTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return PopScope(
      canPop: false,
      child: Scaffold(
        body: SafeArea(
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 460),
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Icon(
                      Icons.system_update_alt_rounded,
                      size: 56,
                      color: theme.colorScheme.primary,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Guncelleme gerekli',
                      textAlign: TextAlign.center,
                      style: theme.textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      '$appName uygulamasinin bu surumu artik desteklenmiyor. '
                      'Devam etmek icin uygulamayi guncelle.',
                      textAlign: TextAlign.center,
                      style: theme.textTheme.bodyMedium,
                    ),
                    const SizedBox(height: 24),
                    FilledButton(
                      onPressed: () {
                        onUpdateTap();
                      },
                      child: const Text('Uygulamayi Guncelle'),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
