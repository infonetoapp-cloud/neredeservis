import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/ui/components/banners/core_stale_status_banner.dart';
import 'package:neredeservis/ui/components/buttons/core_buttons.dart';
import 'package:neredeservis/ui/components/cards/core_announcement_card.dart';
import 'package:neredeservis/ui/components/cards/core_route_card.dart';
import 'package:neredeservis/ui/components/indicators/core_badge.dart';
import 'package:neredeservis/ui/components/indicators/core_pill.dart';
import 'package:neredeservis/ui/components/indicators/core_status_chip.dart';
import 'package:neredeservis/ui/components/layout/core_screen_scaffold.dart';
import 'package:neredeservis/ui/components/panels/core_driver_action_panel.dart';
import 'package:neredeservis/ui/components/states/core_empty_state.dart';
import 'package:neredeservis/ui/components/surfaces/core_bottom_sheet.dart';
import 'package:neredeservis/ui/theme/core_theme.dart';

void main() {
  testWidgets('amber button, input, badge and pill components render', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: CoreTheme.light(),
        home: Scaffold(
          body: ListView(
            padding: const EdgeInsets.all(16),
            children: <Widget>[
              CorePrimaryButton(
                label: 'Primary',
                onPressed: () {},
              ),
              const SizedBox(height: 12),
              CoreSecondaryButton(
                label: 'Secondary',
                onPressed: () {},
              ),
              const SizedBox(height: 12),
              CoreDangerButton(
                label: 'Danger',
                onPressed: () {},
              ),
              const SizedBox(height: 12),
              const TextField(
                decoration: InputDecoration(
                  labelText: 'Input',
                  hintText: 'Type something',
                ),
              ),
              const SizedBox(height: 12),
              const CoreBadge(
                label: 'Aktif',
                tone: CoreBadgeTone.success,
              ),
              const SizedBox(height: 12),
              const CorePill(
                label: 'Sabah',
                tone: CoreBadgeTone.warning,
              ),
            ],
          ),
        ),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('Primary'), findsOneWidget);
    expect(find.text('Secondary'), findsOneWidget);
    expect(find.text('Danger'), findsOneWidget);
    expect(find.text('Input'), findsOneWidget);
    expect(find.text('Aktif'), findsOneWidget);
    expect(find.text('Sabah'), findsOneWidget);
  });

  testWidgets('amber bottom sheet template renders and actions are visible', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: CoreTheme.light(),
        home: Builder(
          builder: (BuildContext context) {
            return Scaffold(
              body: Center(
                child: ElevatedButton(
                  onPressed: () {
                    showCoreBottomSheet<void>(
                      context: context,
                      title: 'Bottom Sheet',
                      subtitle: 'Template',
                      primaryActionLabel: 'Onayla',
                      secondaryActionLabel: 'Iptal',
                      child: const Text('Icerik'),
                    );
                  },
                  child: const Text('Open'),
                ),
              ),
            );
          },
        ),
      ),
    );

    await tester.tap(find.text('Open'));
    await tester.pumpAndSettle();

    expect(find.text('Bottom Sheet'), findsOneWidget);
    expect(find.text('Template'), findsOneWidget);
    expect(find.text('Icerik'), findsOneWidget);
    expect(find.text('Onayla'), findsOneWidget);
    expect(find.text('Iptal'), findsOneWidget);
  });

  testWidgets('amber scaffold, cards, banner, status and panel render', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: CoreTheme.light(),
        home: CoreScreenScaffold(
          title: 'Driver Home',
          subtitle: 'Bilesen demo',
          scrollable: true,
          body: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: <Widget>[
              const CoreStatusChip(
                label: 'Yayinda',
                tone: CoreStatusChipTone.green,
              ),
              const SizedBox(height: 12),
              CoreRouteCard(
                routeName: 'Darica -> GOSB',
                metaLine: '6 durak - 14 yolcu',
                scheduleLabel: '06:30',
                statusChip: const CoreStatusChip(
                  label: 'Aktif',
                  tone: CoreStatusChipTone.green,
                  compact: true,
                ),
                onPrimaryAction: () {},
              ),
              const SizedBox(height: 12),
              const CoreAnnouncementCard(
                title: 'Duyuru',
                message: 'Bugun D3 duragi atlanacak.',
                sentAtLabel: '5 dk once',
                channelLabel: 'In-app',
              ),
              const SizedBox(height: 12),
              const CoreStaleStatusBanner(
                message: 'Son konum 2 dk once guncellendi.',
              ),
              const SizedBox(height: 12),
              CoreDriverActionPanel(
                isTripActive: true,
                onPrimaryAction: () {},
                onSecondaryAction: () {},
                secondaryLabel: 'Mola',
                onAnnouncementTap: () {},
              ),
              const SizedBox(height: 12),
              const CoreEmptyState(
                title: 'Kayit yok',
                description: 'Yeni rota ekleyince burada goreceksin.',
              ),
            ],
          ),
        ),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('Driver Home'), findsOneWidget);
    expect(find.text('Darica -> GOSB'), findsOneWidget);
    expect(find.text('Duyuru'), findsOneWidget);
    expect(find.text('Son konum 2 dk once guncellendi.'), findsOneWidget);
    expect(find.text('Seferi Bitir'), findsOneWidget);
    expect(find.text('Kayit yok'), findsOneWidget);
  });
}
