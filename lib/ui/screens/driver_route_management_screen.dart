import 'package:flutter/material.dart';

import '../components/buttons/amber_buttons.dart';
import '../components/layout/amber_screen_scaffold.dart';
import '../tokens/spacing_tokens.dart';

class DriverRouteManagementScreen extends StatelessWidget {
  const DriverRouteManagementScreen({
    super.key,
    this.onCreateRouteTap,
    this.onUpdateRouteTap,
    this.onManageStopsTap,
  });

  final VoidCallback? onCreateRouteTap;
  final VoidCallback? onUpdateRouteTap;
  final VoidCallback? onManageStopsTap;

  @override
  Widget build(BuildContext context) {
    return AmberScreenScaffold(
      title: 'Rota Yonetimi',
      subtitle: 'Driver callable baglantilari',
      scrollable: true,
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: <Widget>[
          const _RouteActionCard(
            title: 'Rota Olustur',
            description:
                'Yeni rota ac, SRV kodu olustur ve yolcu katilimina hazirla.',
          ),
          const SizedBox(height: AmberSpacingTokens.space8),
          AmberPrimaryButton(
            label: 'Yeni Rota Olustur',
            onPressed: onCreateRouteTap,
          ),
          const SizedBox(height: AmberSpacingTokens.space16),
          const _RouteActionCard(
            title: 'Rota Guncelle',
            description:
                'Mevcut route bilgilerini (ad, adres, saat, arsiv durumu) guncelle.',
          ),
          const SizedBox(height: AmberSpacingTokens.space8),
          AmberSecondaryButton(
            label: 'Route Guncelle Ekrani',
            onPressed: onUpdateRouteTap,
          ),
          const SizedBox(height: AmberSpacingTokens.space16),
          const _RouteActionCard(
            title: 'Durak Yonet',
            description:
                'Durak ekle, guncelle veya sil. `upsertStop` ve `deleteStop` cagirilir.',
          ),
          const SizedBox(height: AmberSpacingTokens.space8),
          AmberSecondaryButton(
            label: 'Durak CRUD Ekrani',
            onPressed: onManageStopsTap,
          ),
        ],
      ),
    );
  }
}

class _RouteActionCard extends StatelessWidget {
  const _RouteActionCard({
    required this.title,
    required this.description,
  });

  final String title;
  final String description;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: Theme.of(context).colorScheme.outlineVariant,
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Text(
              title,
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 6),
            Text(description),
          ],
        ),
      ),
    );
  }
}
