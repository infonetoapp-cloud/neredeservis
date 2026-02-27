import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/subscription/presentation/paywall_copy_tr.dart';
import 'package:neredeservis/ui/screens/driver_home_screen.dart';
import 'package:neredeservis/ui/tokens/cta_tokens.dart';
import 'package:neredeservis/ui/theme/core_theme.dart';

void main() {
  testWidgets('driver home screen renders amber sections', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: CoreTheme.light(),
        home: const DriverHomeScreen(
          appName: 'NeredeServis Dev',
        ),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('Sofor Ana Sayfa'), findsOneWidget);
    expect(find.text('Darica -> GOSB'), findsOneWidget);
    expect(find.text('Gebze -> TUZLA'), findsOneWidget);
    expect(find.text('Bugunluk Not'), findsOneWidget);
    expect(find.textContaining('paneli'), findsOneWidget);
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
        theme: CoreTheme.light(),
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

    await tester.tap(find.text(CoreCtaTokens.startTrip).first);
    await tester.pumpAndSettle();
    await tester.tap(find.text('Rota Detayi'));
    await tester.pumpAndSettle();
    await tester.drag(find.byType(Scrollable).first, const Offset(0, -400));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Rotalari Yonet'));
    await tester.pumpAndSettle();
    await tester.tap(find.textContaining('Duyuru'));
    await tester.pumpAndSettle();
    await tester.tap(find.byTooltip('Ayarlar'));
    await tester.pumpAndSettle();

    expect(startTapCount, greaterThan(0));
    expect(manageTapCount, greaterThan(0));
    expect(announcementTapCount, equals(1));
    expect(settingsTapCount, equals(1));
  });

  testWidgets('trial expired banner renders and triggers callback', (
    WidgetTester tester,
  ) async {
    var bannerTapCount = 0;

    await tester.pumpWidget(
      MaterialApp(
        theme: CoreTheme.light(),
        home: DriverHomeScreen(
          appName: 'NeredeServis Dev',
          subscriptionStatus: SubscriptionUiStatus.trialExpired,
          onSubscriptionBannerTap: () {
            bannerTapCount++;
          },
        ),
      ),
    );

    await tester.pumpAndSettle();

    expect(
      find.textContaining('Denemen bitti.'),
      findsOneWidget,
    );
    await tester.tap(find.text('Aboneligi Yonet').first);
    await tester.pumpAndSettle();

    expect(bannerTapCount, equals(1));
  });
}
