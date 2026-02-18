import 'package:flutter/material.dart';

import '../components/banners/amber_stale_status_banner.dart';
import '../components/cards/amber_announcement_card.dart';
import '../components/cards/amber_route_card.dart';
import '../components/indicators/amber_status_chip.dart';
import '../components/layout/amber_screen_scaffold.dart';
import '../components/panels/amber_driver_action_panel.dart';
import '../tokens/spacing_tokens.dart';

class DriverHomeScreen extends StatelessWidget {
  const DriverHomeScreen({
    super.key,
    required this.appName,
    this.onStartTripTap,
    this.onManageRouteTap,
    this.onAnnouncementTap,
    this.onSettingsTap,
  });

  final String appName;
  final VoidCallback? onStartTripTap;
  final VoidCallback? onManageRouteTap;
  final VoidCallback? onAnnouncementTap;
  final VoidCallback? onSettingsTap;

  @override
  Widget build(BuildContext context) {
    return AmberScreenScaffold(
      title: 'Sofor Home',
      subtitle: appName,
      actions: <Widget>[
        IconButton(
          icon: const Icon(Icons.settings_outlined),
          tooltip: 'Ayarlar',
          onPressed: onSettingsTap ?? onManageRouteTap,
        ),
      ],
      scrollable: true,
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: <Widget>[
          const AmberStatusChip(
            label: 'Yayina hazir',
            tone: AmberStatusChipTone.green,
          ),
          const SizedBox(height: AmberSpacingTokens.space12),
          const AmberStaleStatusBanner(
            message: 'Son heartbeat 35 sn once alindi.',
          ),
          const SizedBox(height: AmberSpacingTokens.space16),
          AmberRouteCard(
            routeName: 'Darica -> GOSB',
            metaLine: '6 durak - 14 yolcu',
            scheduleLabel: '06:30',
            statusChip: const AmberStatusChip(
              label: 'Hazir',
              tone: AmberStatusChipTone.green,
              compact: true,
            ),
            primaryActionLabel: 'Seferi Baslat',
            onPrimaryAction: onStartTripTap,
          ),
          const SizedBox(height: AmberSpacingTokens.space12),
          AmberRouteCard(
            routeName: 'Gebze -> TUZLA',
            metaLine: '5 durak - 11 yolcu',
            scheduleLabel: '07:10',
            statusChip: const AmberStatusChip(
              label: 'Planli',
              tone: AmberStatusChipTone.neutral,
              compact: true,
            ),
            primaryActionLabel: 'Rota Detayi',
            onPrimaryAction: onManageRouteTap,
          ),
          const SizedBox(height: AmberSpacingTokens.space12),
          const AmberAnnouncementCard(
            title: 'Bugunluk Not',
            message: 'D2 duraginda yol calismasi var, 2 dk gecikme beklenir.',
            sentAtLabel: '10 dk once',
            channelLabel: 'In-app',
          ),
          const SizedBox(height: AmberSpacingTokens.space12),
          AmberDriverActionPanel(
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
