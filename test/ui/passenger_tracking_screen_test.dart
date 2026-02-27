import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/ui/components/sheets/passenger_map_sheet.dart';
import 'package:neredeservis/ui/screens/passenger_tracking_screen.dart';
import 'package:neredeservis/ui/tokens/empty_state_tokens.dart';
import 'package:neredeservis/ui/theme/core_theme.dart';

void main() {
  final testStops = <PassengerStopInfo>[
    const PassengerStopInfo(name: 'Darica Merkez', isPassed: true),
    const PassengerStopInfo(name: 'Gebze Sanayi', isPassed: true),
    const PassengerStopInfo(
      name: 'GOSB Giris',
      isPassed: false,
      isNext: true,
      passengersWaiting: 3,
    ),
    const PassengerStopInfo(name: 'GOSB Merkez', isPassed: false),
  ];

  Widget buildTestApp({
    String routeName = 'Darica -> GOSB',
    int? estimatedMinutes = 12,
    String? etaSourceLabel = 'Kus ucusu tahmini',
    String? lastEtaSourceLabel,
    bool isSoftLockMode = false,
    String? offlineBannerLabel,
    String? latencyIndicatorLabel,
    LocationFreshness freshness = LocationFreshness.live,
    String? driverNote,
    bool isLate = false,
    String? scheduledTime,
    String? morningReminderNote,
    String? vacationModeNote,
    PassengerDriverSnapshotInfo? driverSnapshot,
    List<PassengerStopInfo> stops = const <PassengerStopInfo>[],
    VoidCallback? onSettingsTap,
    VoidCallback? onSkipTodayTap,
    VoidCallback? onLeaveRouteTap,
    VoidCallback? onKeepNotificationsTap,
    VoidCallback? onBackToServicesTap,
    VoidCallback? onAddServiceTap,
    VoidCallback? onMessageDriverTap,
  }) {
    return MaterialApp(
      theme: CoreTheme.light(),
      home: PassengerTrackingScreen(
        routeName: routeName,
        estimatedMinutes: estimatedMinutes,
        etaSourceLabel: etaSourceLabel,
        lastEtaSourceLabel: lastEtaSourceLabel,
        isSoftLockMode: isSoftLockMode,
        offlineBannerLabel: offlineBannerLabel,
        latencyIndicatorLabel: latencyIndicatorLabel,
        freshness: freshness,
        driverNote: driverNote,
        isLate: isLate,
        scheduledTime: scheduledTime,
        morningReminderNote: morningReminderNote,
        vacationModeNote: vacationModeNote,
        driverSnapshot: driverSnapshot,
        stops: stops,
        onSettingsTap: onSettingsTap,
        onSkipTodayTap: onSkipTodayTap,
        onLeaveRouteTap: onLeaveRouteTap,
        onKeepNotificationsTap: onKeepNotificationsTap,
        onBackToServicesTap: onBackToServicesTap,
        onAddServiceTap: onAddServiceTap,
        onMessageDriverTap: onMessageDriverTap,
      ),
    );
  }

  group('PassengerTrackingScreen', () {
    testWidgets('renders route name and ETA', (WidgetTester tester) async {
      await tester.pumpWidget(buildTestApp());
      await tester.pumpAndSettle();

      expect(find.text('Darica -> GOSB'), findsWidgets);
      expect(find.text('~12'), findsOneWidget);
      expect(find.text('dk'), findsOneWidget);
    });

    testWidgets('shows Canlı status chip when live', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(buildTestApp());
      await tester.pumpAndSettle();

      expect(find.text('Canlı'), findsWidgets);
    });

    testWidgets('shows Hesaplaniyor when ETA is null', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(buildTestApp(estimatedMinutes: null));
      await tester.pumpAndSettle();

      expect(find.textContaining('aplaniyor'), findsOneWidget);
    });

    testWidgets('shows last ETA source label when provided', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        buildTestApp(
          etaSourceLabel: 'Sanal Durak: Ev • Directions API',
          lastEtaSourceLabel: 'Directions API',
        ),
      );
      await tester.pumpAndSettle();

      expect(find.textContaining('Son ETA kaynağı'), findsOneWidget);
      expect(find.textContaining('Directions API'), findsWidgets);
    });

    testWidgets('shows late departure banner when isLate', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        buildTestApp(isLate: true, scheduledTime: '07:30'),
      );
      await tester.pumpAndSettle();

      expect(
        find.textContaining('Olası Gecikme'),
        findsOneWidget,
      );
      expect(find.textContaining('07:30'), findsOneWidget);
    });

    testWidgets('hides late banner when not late', (WidgetTester tester) async {
      await tester.pumpWidget(buildTestApp());
      await tester.pumpAndSettle();

      expect(find.textContaining('Olası Gecikme'), findsNothing);
    });

    testWidgets('shows late fallback CTA buttons when callbacks provided', (
      WidgetTester tester,
    ) async {
      var keepNotificationsTapped = false;
      var backToServicesTapped = false;

      await tester.pumpWidget(
        buildTestApp(
          isLate: true,
          scheduledTime: '07:30',
          onKeepNotificationsTap: () {
            keepNotificationsTapped = true;
          },
          onBackToServicesTap: () {
            backToServicesTapped = true;
          },
        ),
      );
      await tester.pumpAndSettle();

      final keepFinder = find.widgetWithText(
        OutlinedButton,
        'Bildirim Açık Kalsın',
      );
      final backFinder = find.widgetWithText(
        OutlinedButton,
        'Servislerime Dön',
      );
      expect(keepFinder, findsOneWidget);
      expect(backFinder, findsOneWidget);

      await tester.ensureVisible(keepFinder);
      await tester.pumpAndSettle();
      await tester.tap(keepFinder);
      await tester.pumpAndSettle();
      await tester.ensureVisible(backFinder);
      await tester.pumpAndSettle();
      await tester.tap(backFinder);
      await tester.pumpAndSettle();

      expect(keepNotificationsTapped, isTrue);
      expect(backToServicesTapped, isTrue);
    });

    testWidgets('hides late fallback CTA buttons without callbacks', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        buildTestApp(isLate: true, scheduledTime: '07:30'),
      );
      await tester.pumpAndSettle();

      expect(find.text('Bildirim Açık Kalsın'), findsNothing);
      expect(find.text('Servislerime Dön'), findsNothing);
    });

    testWidgets('shows driver note when provided', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        buildTestApp(driverNote: 'Trafik yogun, 5 dk gecikmeli'),
      );
      await tester.pumpAndSettle();

      expect(find.text('Şoför Notu'), findsOneWidget);
      expect(find.text('Trafik yogun, 5 dk gecikmeli'), findsOneWidget);
    });

    testWidgets('shows morning reminder note when provided', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        buildTestApp(
          morningReminderNote:
              'Sabah hatirlatmasi: kalkis saati yaklasiyor (07:30).',
        ),
      );
      await tester.pumpAndSettle();

      expect(find.textContaining('Sabah hatirlatmasi'), findsOneWidget);
    });

    testWidgets('shows vacation mode note when provided', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        buildTestApp(vacationModeNote: 'Tatil modu aktif. Donus: 20.02.2026'),
      );
      await tester.pumpAndSettle();

      expect(find.textContaining('Tatil modu aktif'), findsOneWidget);
    });

    testWidgets('shows driver snapshot card when provided', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        buildTestApp(
          driverSnapshot: const PassengerDriverSnapshotInfo(
            name: 'Ahmet Yilmaz',
            plate: '34ABC123',
            phone: '0555****11',
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.textContaining('Ahmet Yilmaz'), findsOneWidget);
      expect(find.textContaining('34ABC123'), findsOneWidget);
      expect(find.textContaining('Iletisim:'), findsOneWidget);
      expect(
        find.textContaining('Gizlilik: Telefon bilgisi maskeli paylasilir.'),
        findsOneWidget,
      );
    });

    testWidgets('applies masking policy to raw driver phone in snapshot', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        buildTestApp(
          driverSnapshot: const PassengerDriverSnapshotInfo(
            name: 'Ahmet Yilmaz',
            plate: '34ABC123',
            phone: '05321234567',
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.textContaining('Iletisim: 053******67'), findsOneWidget);
      expect(find.textContaining('05321234567'), findsNothing);
      expect(
        find.textContaining('Gizlilik: Telefon bilgisi maskeli paylasilir.'),
        findsOneWidget,
      );
    });

    testWidgets('hides phone value when driver phone visibility is disabled', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        buildTestApp(
          driverSnapshot: const PassengerDriverSnapshotInfo(
            name: 'Ahmet Yilmaz',
            plate: '34ABC123',
            phone: null,
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Telefon paylasimi kapali'), findsOneWidget);
      expect(
        find.text('Gizlilik: Telefon bilgisi yolculara kapali.'),
        findsOneWidget,
      );
      expect(find.textContaining('Iletisim:'), findsNothing);
    });

    testWidgets('hides driver note when null', (WidgetTester tester) async {
      await tester.pumpWidget(buildTestApp());
      await tester.pumpAndSettle();

      expect(find.text('Şoför Notu'), findsNothing);
    });

    testWidgets('shows empty stop state when route stops are missing',
        (WidgetTester tester) async {
      await tester.pumpWidget(buildTestApp(stops: const <PassengerStopInfo>[]));
      await tester.pumpAndSettle();

      expect(find.text(CoreEmptyStateTokens.passengerStopsTitle), findsOneWidget);
      expect(
        find.text(CoreEmptyStateTokens.passengerStopsDescription),
        findsOneWidget,
      );
    });

    testWidgets('renders stop list when provided', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(buildTestApp(stops: testStops));
      await tester.pumpAndSettle();

      expect(find.byType(PassengerMapSheet), findsOneWidget);

      // The stop names should be in the widget tree
      expect(find.text('Duraklar'), findsOneWidget);
      expect(find.text('Darica Merkez'), findsOneWidget);
      expect(find.text('GOSB Giris'), findsOneWidget);
      expect(find.text('GOSB Merkez'), findsOneWidget);
    });

    testWidgets('shows stale banner for lost freshness', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        buildTestApp(
          freshness: LocationFreshness.lost,
        ),
      );
      await tester.pumpAndSettle();

      expect(
        find.textContaining('bağlantısı kesildi'),
        findsOneWidget,
      );
      expect(find.text('Bağlantı yok'), findsAtLeastNWidgets(1));
    });

    testWidgets('hides stale banner when live', (WidgetTester tester) async {
      await tester.pumpWidget(buildTestApp());
      await tester.pumpAndSettle();

      expect(find.textContaining('bağlantısı kesildi'), findsNothing);
      expect(find.textContaining('Konum bilgisi gecikiyor'), findsNothing);
    });

    testWidgets('shows offline banner and reconnect latency chip when provided',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        buildTestApp(
          offlineBannerLabel:
              'İnternet bağlantısı kesildi. Son bilinen konum gösteriliyor.',
          latencyIndicatorLabel: 'Yeniden bağlantı 8 sn',
        ),
      );
      await tester.pumpAndSettle();

      expect(
        find.text(
          'İnternet bağlantısı kesildi. Son bilinen konum gösteriliyor.',
        ),
        findsOneWidget,
      );
      expect(find.text('Yeniden bağlantı 8 sn'), findsOneWidget);
    });

    testWidgets('shows soft-lock stale label when mode is enabled',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        buildTestApp(
          freshness: LocationFreshness.stale,
          lastEtaSourceLabel: 'Fallback',
          isSoftLockMode: true,
        ),
      );
      await tester.pumpAndSettle();

      expect(
        find.textContaining('Servis Bağlantısı: Düşük Öncelik Modu'),
        findsOneWidget,
      );
    });

        testWidgets('shows leave action when callback is provided',
        (WidgetTester tester) async {
      var leaveTapped = false;
      await tester.pumpWidget(
        buildTestApp(
          onLeaveRouteTap: () {
            leaveTapped = true;
          },
        ),
      );
      await tester.pumpAndSettle();
      final actionsButton = find.byTooltip('Islemler');
      expect(actionsButton, findsOneWidget);
      await tester.tap(actionsButton);
      await tester.pumpAndSettle();
      await tester.tap(find.textContaining('Rotadan Ayr'));
      await tester.pumpAndSettle();
      expect(leaveTapped, isTrue);
    });
        testWidgets('shows settings action when callback is provided',
        (WidgetTester tester) async {
      var settingsTapped = false;
      await tester.pumpWidget(
        buildTestApp(
          onSettingsTap: () {
            settingsTapped = true;
          },
        ),
      );
      await tester.pumpAndSettle();
      final actionsButton = find.byTooltip('Islemler');
      expect(actionsButton, findsOneWidget);
      await tester.tap(actionsButton);
      await tester.pumpAndSettle();
      await tester.tap(find.text('Yolcu Ayarlari'));
      await tester.pumpAndSettle();
      expect(settingsTapped, isTrue);
    });
        testWidgets('shows skip today action when callback is provided',
        (WidgetTester tester) async {
      var skipTapped = false;
      await tester.pumpWidget(
        buildTestApp(
          onSkipTodayTap: () {
            skipTapped = true;
          },
        ),
      );
      await tester.pumpAndSettle();
      final actionsButton = find.byTooltip('Islemler');
      expect(actionsButton, findsOneWidget);
      await tester.tap(actionsButton);
      await tester.pumpAndSettle();
      await tester.tap(find.textContaining('Binmiyorum').last);
      await tester.pumpAndSettle();
      expect(skipTapped, isTrue);
    });
    testWidgets('opens drawer menu and triggers add service action',
        (WidgetTester tester) async {
      var addServiceTapped = false;
      await tester.pumpWidget(
        buildTestApp(
          onAddServiceTap: () {
            addServiceTapped = true;
          },
        ),
      );
      await tester.pumpAndSettle();

      final menuButton = find.byTooltip('Menu');
      expect(menuButton, findsOneWidget);
      await tester.tap(menuButton);
      await tester.pumpAndSettle();

      final addServiceTile = find.text('Yeni Servis Ekle');
      expect(addServiceTile, findsOneWidget);
      await tester.tap(addServiceTile);
      await tester.pumpAndSettle();

      expect(addServiceTapped, isTrue);
    });

        testWidgets('shows message driver action and triggers callback',
        (WidgetTester tester) async {
      var messageTapped = false;
      await tester.pumpWidget(
        buildTestApp(
          driverSnapshot: const PassengerDriverSnapshotInfo(
            name: 'Ahmet Yilmaz',
            plate: '34ABC123',
            phone: '05321234567',
          ),
          onMessageDriverTap: () {
            messageTapped = true;
          },
        ),
      );
      await tester.pumpAndSettle();
      final messageButton = find.textContaining('Mesaj');
      expect(messageButton, findsOneWidget);
      await tester.ensureVisible(messageButton);
      await tester.pumpAndSettle();
      await tester.tap(messageButton);
      await tester.pumpAndSettle();
      expect(messageTapped, isTrue);
    });  });
}

