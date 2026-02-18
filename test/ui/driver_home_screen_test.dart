import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/ui/screens/driver_home_screen.dart';
import 'package:neredeservis/ui/theme/theme_amber.dart';

void main() {
  testWidgets('driver home screen renders amber sections', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: AmberTheme.light(),
        home: const DriverHomeScreen(
          appName: 'NeredeServis Dev',
        ),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('Sofor Home'), findsOneWidget);
    expect(find.text('Darica -> GOSB'), findsOneWidget);
    expect(find.text('Gebze -> TUZLA'), findsOneWidget);
    expect(find.text('Bugunluk Not'), findsOneWidget);
    expect(find.text('Sefer baslatma paneli'), findsOneWidget);
  });

  testWidgets('driver home actions trigger callbacks', (
    WidgetTester tester,
  ) async {
    var startTapCount = 0;
    var manageTapCount = 0;
    var announcementTapCount = 0;
    var settingsTapCount = 0;

    await tester.pumpWidget(
      MaterialApp(
        theme: AmberTheme.light(),
        home: DriverHomeScreen(
          appName: 'NeredeServis Dev',
          onStartTripTap: () {
            startTapCount++;
          },
          onManageRouteTap: () {
            manageTapCount++;
          },
          onAnnouncementTap: () {
            announcementTapCount++;
          },
          onSettingsTap: () {
            settingsTapCount++;
          },
        ),
      ),
    );

    await tester.tap(find.text('Seferi Baslat').first);
    await tester.pumpAndSettle();
    await tester.tap(find.text('Rota Detayi'));
    await tester.pumpAndSettle();
    await tester.drag(find.byType(Scrollable).first, const Offset(0, -400));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Rotalari Yonet'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Duyuru gonder'));
    await tester.pumpAndSettle();
    await tester.tap(find.byTooltip('Ayarlar'));
    await tester.pumpAndSettle();

    expect(startTapCount, greaterThan(0));
    expect(manageTapCount, greaterThan(0));
    expect(announcementTapCount, equals(1));
    expect(settingsTapCount, equals(1));
  });
}
