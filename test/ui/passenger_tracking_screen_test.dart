import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/ui/components/sheets/passenger_map_sheet.dart';
import 'package:neredeservis/ui/screens/passenger_tracking_screen.dart';
import 'package:neredeservis/ui/theme/theme_amber.dart';

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
    LocationFreshness freshness = LocationFreshness.live,
    String? driverNote,
    bool isLate = false,
    String? scheduledTime,
    List<PassengerStopInfo> stops = const <PassengerStopInfo>[],
    VoidCallback? onSettingsTap,
    VoidCallback? onLeaveRouteTap,
  }) {
    return MaterialApp(
      theme: AmberTheme.light(),
      home: PassengerTrackingScreen(
        routeName: routeName,
        estimatedMinutes: estimatedMinutes,
        freshness: freshness,
        driverNote: driverNote,
        isLate: isLate,
        scheduledTime: scheduledTime,
        stops: stops,
        onSettingsTap: onSettingsTap,
        onLeaveRouteTap: onLeaveRouteTap,
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

    testWidgets('shows Canli status chip when live', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(buildTestApp());
      await tester.pumpAndSettle();

      expect(find.text('Canli'), findsWidgets);
    });

    testWidgets('shows Hesaplaniyor when ETA is null', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(buildTestApp(estimatedMinutes: null));
      await tester.pumpAndSettle();

      expect(find.text('Hesaplaniyor...'), findsOneWidget);
    });

    testWidgets('shows late departure banner when isLate', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        buildTestApp(isLate: true, scheduledTime: '07:30'),
      );
      await tester.pumpAndSettle();

      expect(
        find.textContaining('Olasi Gecikme'),
        findsOneWidget,
      );
      expect(find.textContaining('07:30'), findsOneWidget);
    });

    testWidgets('hides late banner when not late', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(buildTestApp());
      await tester.pumpAndSettle();

      expect(find.textContaining('Olasi Gecikme'), findsNothing);
    });

    testWidgets('shows driver note when provided', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        buildTestApp(driverNote: 'Trafik yogun, 5 dk gecikmeli'),
      );
      await tester.pumpAndSettle();

      expect(find.text('Sofor Notu'), findsOneWidget);
      expect(find.text('Trafik yogun, 5 dk gecikmeli'), findsOneWidget);
    });

    testWidgets('hides driver note when null', (WidgetTester tester) async {
      await tester.pumpWidget(buildTestApp());
      await tester.pumpAndSettle();

      expect(find.text('Sofor Notu'), findsNothing);
    });

    testWidgets('renders stop list when provided', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(buildTestApp(stops: testStops));
      await tester.pumpAndSettle();

      // Drag the sheet up to reveal stop list
      final sheetFinder = find.byType(DraggableScrollableSheet);
      expect(sheetFinder, findsOneWidget);

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
        find.textContaining('baglantisi kesildi'),
        findsOneWidget,
      );
      expect(find.text('Baglanti yok'), findsAtLeastNWidgets(1));
    });

    testWidgets('hides stale banner when live', (WidgetTester tester) async {
      await tester.pumpWidget(buildTestApp());
      await tester.pumpAndSettle();

      expect(find.textContaining('baglantisi kesildi'), findsNothing);
      expect(find.textContaining('Konum bilgisi gecikiyor'), findsNothing);
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

      final leaveButton = find.byTooltip("Rota'dan Ayril");
      expect(leaveButton, findsOneWidget);
      await tester.tap(leaveButton);
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

      final settingsButton = find.byTooltip('Yolcu Ayarlari');
      expect(settingsButton, findsOneWidget);
      await tester.tap(settingsButton);
      await tester.pumpAndSettle();

      expect(settingsTapped, isTrue);
    });
  });
}
