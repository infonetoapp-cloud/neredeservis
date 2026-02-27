import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/ui/components/cards/core_announcement_card.dart';
import 'package:neredeservis/ui/components/cards/core_route_card.dart';
import 'package:neredeservis/ui/components/indicators/core_status_chip.dart';
import 'package:neredeservis/ui/components/layout/core_screen_scaffold.dart';
import 'package:neredeservis/ui/theme/core_theme.dart';

void main() {
  testWidgets('amber ui snapshot stays stable', (WidgetTester tester) async {
    tester.view.devicePixelRatio = 1.0;
    tester.view.physicalSize = const Size(430, 932);
    addTearDown(() {
      tester.view.resetDevicePixelRatio();
      tester.view.resetPhysicalSize();
    });

    await tester.pumpWidget(
      MaterialApp(
        theme: CoreTheme.light(),
        home: CoreScreenScaffold(
          title: 'Golden',
          subtitle: 'Core',
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
            ],
          ),
        ),
      ),
    );

    await tester.pumpAndSettle();

    await expectLater(
      find.byType(MaterialApp),
      matchesGoldenFile('goldens/core_components.png'),
    );
  });
}
