import 'package:flutter/material.dart';

import '../../features/subscription/presentation/paywall_copy_tr.dart';
import '../components/banners/core_stale_status_banner.dart';
import '../components/cards/core_announcement_card.dart';
import '../components/cards/core_route_card.dart';
import '../components/indicators/core_status_chip.dart';
import '../components/layout/core_screen_scaffold.dart';
import '../components/panels/core_driver_action_panel.dart';
import '../tokens/core_spacing.dart';
import '../tokens/cta_tokens.dart';
import '../tokens/icon_tokens.dart';

class DriverHomeScreen extends StatelessWidget {
  const DriverHomeScreen({
    super.key,
    required this.appName,
    this.onStartTripTap,
    this.onManageRouteTap,
    this.onAnnouncementTap,
    this.onSettingsTap,
    this.subscriptionStatus,
    this.onSubscriptionBannerTap,
  });

  final String appName;
  final VoidCallback? onStartTripTap;
  final VoidCallback? onManageRouteTap;
  final VoidCallback? onAnnouncementTap;
  final VoidCallback? onSettingsTap;

  // Compatibility fields kept while UI tests and router usage converge.
  final SubscriptionUiStatus? subscriptionStatus;
  final VoidCallback? onSubscriptionBannerTap;

  @override
  Widget build(BuildContext context) {
    final showTrialExpiredBanner =
        subscriptionStatus == SubscriptionUiStatus.trialExpired;

    return CoreScreenScaffold(
      title: 'Sofor Ana Sayfa',
      subtitle: appName,
      actions: <Widget>[
        IconButton(
          icon: const Icon(CoreIconTokens.settings),
          tooltip: 'Ayarlar',
          onPressed: onSettingsTap ?? onManageRouteTap,
        ),
      ],
      scrollable: true,
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: <Widget>[
          const CoreStatusChip(
            label: 'Yayina hazir',
            tone: CoreStatusChipTone.green,
          ),
          const SizedBox(height: CoreSpacing.space12),
          const CoreStaleStatusBanner(
            message: 'Son heartbeat 35 sn once alindi.',
          ),
          if (showTrialExpiredBanner) ...<Widget>[
            const SizedBox(height: CoreSpacing.space12),
            _SubscriptionBanner(
              // Keep callback optional for backward-compatible tests.
              onTap: onSubscriptionBannerTap,
            ),
          ],
          const SizedBox(height: CoreSpacing.space16),
          CoreRouteCard(
            routeName: 'Darica -> GOSB',
            metaLine: '6 durak - 14 yolcu',
            scheduleLabel: '06:30',
            statusChip: const CoreStatusChip(
              label: 'Hazir',
              tone: CoreStatusChipTone.green,
              compact: true,
            ),
            primaryActionLabel: CoreCtaTokens.startTrip,
            onPrimaryAction: onStartTripTap,
          ),
          const SizedBox(height: CoreSpacing.space12),
          CoreRouteCard(
            routeName: 'Gebze -> TUZLA',
            metaLine: '5 durak - 11 yolcu',
            scheduleLabel: '07:10',
            statusChip: const CoreStatusChip(
              label: 'Planli',
              tone: CoreStatusChipTone.neutral,
              compact: true,
            ),
            primaryActionLabel: 'Rota Detayi',
            onPrimaryAction: onManageRouteTap,
          ),
          const SizedBox(height: CoreSpacing.space12),
          const CoreAnnouncementCard(
            title: 'Bugunluk Not',
            message: 'D2 duraginda yol calismasi var, 2 dk gecikme beklenir.',
            sentAtLabel: '10 dk once',
            channelLabel: 'In-app',
          ),
          const SizedBox(height: CoreSpacing.space12),
          CoreDriverActionPanel(
            isTripActive: false,
            onPrimaryAction: onStartTripTap,
            onSecondaryAction: onManageRouteTap,
            secondaryLabel: 'Rotalari Yonet',
            onAnnouncementTap: onAnnouncementTap,
          ),
        ],
      ),
    );
  }
}

class _SubscriptionBanner extends StatelessWidget {
  const _SubscriptionBanner({
    this.onTap,
  });

  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(CoreSpacing.space12),
        child: Row(
          children: <Widget>[
            const Expanded(
              child: Text(
                'Denemen bitti. Premium ozellikler icin aboneligi yonet.',
              ),
            ),
            TextButton(
              onPressed: onTap,
              child: const Text('Aboneligi Yonet'),
            ),
          ],
        ),
      ),
    );
  }
}
