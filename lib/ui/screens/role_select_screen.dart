import 'package:flutter/material.dart';

import '../components/buttons/amber_buttons.dart';
import '../tokens/color_tokens.dart';
import '../tokens/radius_tokens.dart';
import '../tokens/spacing_tokens.dart';

class RoleSelectScreen extends StatelessWidget {
  const RoleSelectScreen({
    super.key,
    required this.appName,
    this.onDriverTap,
    this.onPassengerTap,
  });

  final String appName;
  final VoidCallback? onDriverTap;
  final VoidCallback? onPassengerTap;

  @override
  Widget build(BuildContext context) {
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
                  Text(
                    appName,
                    style: textTheme.titleMedium,
                  ),
                  const SizedBox(height: AmberSpacingTokens.space24),
                  Text(
                    'Devam etmek icin rolunu sec',
                    style: textTheme.headlineSmall,
                  ),
                  const SizedBox(height: AmberSpacingTokens.space8),
                  Text(
                    'Iki net secenek var: sofor veya yolcu.',
                    style: textTheme.bodyMedium?.copyWith(
                      color: AmberColorTokens.ink700,
                    ),
                  ),
                  const SizedBox(height: AmberSpacingTokens.space20),
                  _RoleOptionCard(
                    icon: Icons.directions_bus_rounded,
                    title: 'Soforum',
                    description:
                        'Rota ac, duyuru paylas, yolcularin konumu tek ekranda gormesini sagla.',
                    action: AmberPrimaryButton(
                      label: 'Sofor Olarak Devam Et',
                      onPressed: onDriverTap,
                    ),
                  ),
                  const SizedBox(height: AmberSpacingTokens.space12),
                  _RoleOptionCard(
                    icon: Icons.person_pin_circle_rounded,
                    title: 'Yolcuyum',
                    description:
                        'Kod veya QR ile katil, ETA ve canli konumu tek ekranda takip et.',
                    action: AmberSecondaryButton(
                      label: 'Yolcu Olarak Devam Et',
                      onPressed: onPassengerTap,
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

class _RoleOptionCard extends StatelessWidget {
  const _RoleOptionCard({
    required this.icon,
    required this.title,
    required this.description,
    required this.action,
  });

  final IconData icon;
  final String title;
  final String description;
  final Widget action;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: AmberColorTokens.surface0,
        borderRadius: AmberRadiusTokens.radius20,
        border: Border.all(
          color: AmberColorTokens.line200,
        ),
      ),
      child: Padding(
        padding: AmberSpacingTokens.cardPadding,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Icon(
              icon,
              color: AmberColorTokens.amber500,
            ),
            const SizedBox(height: AmberSpacingTokens.space12),
            Text(
              title,
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: AmberSpacingTokens.space8),
            Text(
              description,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AmberColorTokens.ink700,
                  ),
            ),
            const SizedBox(height: AmberSpacingTokens.space16),
            action,
          ],
        ),
      ),
    );
  }
}
