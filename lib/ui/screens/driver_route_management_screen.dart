import 'package:flutter/material.dart';

import '../components/buttons/core_buttons.dart';
import '../components/layout/core_screen_scaffold.dart';
import '../tokens/core_spacing.dart';

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
    return CoreScreenScaffold(
      title: 'Rota Merkezi',
      subtitle: 'Şoför operasyon paneli',
      scrollable: true,
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: <Widget>[
          const _OverviewCard(),
          const SizedBox(height: CoreSpacing.space16),
          _RouteActionCard(
            title: 'Hızlı Rota Oluştur',
            description:
                'Adres sec, saat belirle, rota hazir. Koordinatla ugrasma.',
            icon: Icons.bolt_rounded,
            primary: true,
            buttonLabel: 'Hızlı Başlat',
            onTap: onCreateRouteTap,
          ),
          const SizedBox(height: CoreSpacing.space12),
          _RouteActionCard(
            title: 'Rota Güncelle',
            description:
                'Saat, adres, arsiv ve şoför yetkilerini tek ekrandan güncelle.',
            icon: Icons.route_rounded,
            buttonLabel: 'Rota Güncelle',
            onTap: onUpdateRouteTap,
          ),
          const SizedBox(height: CoreSpacing.space12),
          _RouteActionCard(
            title: 'Durakları Yönet',
            description:
                'Durak ekle, düzenle, sil ve sıralamayı kolayca değiştir.',
            icon: Icons.pin_drop_outlined,
            buttonLabel: 'Durakları Aç',
            onTap: onManageStopsTap,
          ),
        ],
      ),
    );
  }
}

class _OverviewCard extends StatelessWidget {
  const _OverviewCard();

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    return DecoratedBox(
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surfaceContainerLow,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Theme.of(context).colorScheme.outlineVariant),
      ),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Text(
              'Bugünku hedef',
              style: textTheme.titleMedium,
            ),
            const SizedBox(height: CoreSpacing.space8),
            Text(
              'Rota işlerini tek akışta bitir. Hızlı kur ve durakları kolay yönet.',
              style: textTheme.bodyMedium,
            ),
          ],
        ),
      ),
    );
  }
}

class _RouteActionCard extends StatelessWidget {
  const _RouteActionCard({
    required this.title,
    required this.description,
    required this.icon,
    required this.buttonLabel,
    this.primary = false,
    this.onTap,
  });

  final String title;
  final String description;
  final IconData icon;
  final String buttonLabel;
  final bool primary;
  final VoidCallback? onTap;

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
            Row(
              children: <Widget>[
                Icon(icon, size: 20),
                const SizedBox(width: CoreSpacing.space8),
                Expanded(
                  child: Text(
                    title,
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                ),
              ],
            ),
            const SizedBox(height: CoreSpacing.space8),
            Text(description),
            const SizedBox(height: CoreSpacing.space12),
            if (primary)
              CorePrimaryButton(
                label: buttonLabel,
                onPressed: onTap,
              )
            else
              CoreSecondaryButton(
                label: buttonLabel,
                onPressed: onTap,
              ),
          ],
        ),
      ),
    );
  }
}
