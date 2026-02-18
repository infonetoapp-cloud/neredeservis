import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/ui/components/banners/amber_stale_status_banner.dart';
import 'package:neredeservis/ui/components/buttons/amber_buttons.dart';
import 'package:neredeservis/ui/components/cards/amber_announcement_card.dart';
import 'package:neredeservis/ui/components/cards/amber_route_card.dart';
import 'package:neredeservis/ui/components/indicators/amber_badge.dart';
import 'package:neredeservis/ui/components/indicators/amber_pill.dart';
import 'package:neredeservis/ui/components/indicators/amber_status_chip.dart';
import 'package:neredeservis/ui/components/layout/amber_screen_scaffold.dart';
import 'package:neredeservis/ui/components/panels/amber_driver_action_panel.dart';
import 'package:neredeservis/ui/components/states/amber_empty_state.dart';
import 'package:neredeservis/ui/components/surfaces/amber_bottom_sheet.dart';
import 'package:neredeservis/ui/theme/theme_amber.dart';

void main() {
  testWidgets('amber button, input, badge and pill components render', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: AmberTheme.light(),
        home: Scaffold(
          body: ListView(
            padding: const EdgeInsets.all(16),
            children: <Widget>[
              AmberPrimaryButton(
                label: 'Primary',
                onPressed: () {},
              ),
              const SizedBox(height: 12),
              AmberSecondaryButton(
                label: 'Secondary',
                onPressed: () {},
              ),
              const SizedBox(height: 12),
              AmberDangerButton(
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
              const AmberBadge(
                label: 'Aktif',
                tone: AmberBadgeTone.success,
              ),
              const SizedBox(height: 12),
              const AmberPill(
                label: 'Sabah',
                tone: AmberBadgeTone.warning,
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
        theme: AmberTheme.light(),
        home: Builder(
          builder: (BuildContext context) {
            return Scaffold(
              body: Center(
                child: ElevatedButton(
                  onPressed: () {
                    showAmberBottomSheet<void>(
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
        theme: AmberTheme.light(),
        home: AmberScreenScaffold(
          title: 'Driver Home',
          subtitle: 'Bilesen demo',
          scrollable: true,
          body: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: <Widget>[
              const AmberStatusChip(
                label: 'Yayinda',
                tone: AmberStatusChipTone.green,
              ),
              const SizedBox(height: 12),
              AmberRouteCard(
                routeName: 'Darica -> GOSB',
                metaLine: '6 durak - 14 yolcu',
                scheduleLabel: '06:30',
                statusChip: const AmberStatusChip(
                  label: 'Aktif',
                  tone: AmberStatusChipTone.green,
                  compact: true,
                ),
                onPrimaryAction: () {},
              ),
              const SizedBox(height: 12),
              const AmberAnnouncementCard(
                title: 'Duyuru',
                message: 'Bugun D3 duragi atlanacak.',
                sentAtLabel: '5 dk once',
                channelLabel: 'In-app',
              ),
              const SizedBox(height: 12),
              const AmberStaleStatusBanner(
                message: 'Son konum 2 dk once guncellendi.',
              ),
              const SizedBox(height: 12),
              AmberDriverActionPanel(
                isTripActive: true,
                onPrimaryAction: () {},
                onSecondaryAction: () {},
                secondaryLabel: 'Mola',
                onAnnouncementTap: () {},
              ),
              const SizedBox(height: 12),
              const AmberEmptyState(
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
