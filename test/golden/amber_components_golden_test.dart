import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/ui/components/cards/amber_announcement_card.dart';
import 'package:neredeservis/ui/components/cards/amber_route_card.dart';
import 'package:neredeservis/ui/components/indicators/amber_status_chip.dart';
import 'package:neredeservis/ui/components/layout/amber_screen_scaffold.dart';
import 'package:neredeservis/ui/theme/theme_amber.dart';

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
        theme: AmberTheme.light(),
        home: AmberScreenScaffold(
          title: 'Golden',
          subtitle: 'Amber',
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
            ],
          ),
        ),
      ),
    );

    await tester.pumpAndSettle();

    await expectLater(
      find.byType(MaterialApp),
      matchesGoldenFile('goldens/amber_components.png'),
    );
  });
}
