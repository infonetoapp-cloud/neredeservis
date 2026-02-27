import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/ui/components/buttons/core_buttons.dart';
import 'package:neredeservis/ui/components/feedback/core_snackbars.dart';
import 'package:neredeservis/ui/components/indicators/core_heartbeat_indicator.dart';
import 'package:neredeservis/ui/components/layout/core_screen_scaffold.dart';
import 'package:neredeservis/ui/screens/active_trip_screen.dart';
import 'package:neredeservis/ui/screens/join_screen.dart';
import 'package:neredeservis/ui/screens/passenger_tracking_screen.dart';
import 'package:neredeservis/ui/screens/paywall_screen.dart';
import 'package:neredeservis/ui/theme/core_theme.dart';
import 'package:neredeservis/ui/tokens/core_colors.dart';
import 'package:neredeservis/ui/tokens/icon_tokens.dart';

void main() {
  group('Core quality gate', () {
    test('core color pairs pass WCAG AA contrast', () {
      expect(
        _contrastRatio(CoreColors.ink900, CoreColors.surface0),
        greaterThanOrEqualTo(4.5),
      );
      expect(
        _contrastRatio(CoreColors.amber500, CoreColors.surface0),
        greaterThanOrEqualTo(4.5),
      );
      expect(
        _contrastRatio(
            CoreColors.dangerStrong, CoreColors.surface0),
        greaterThanOrEqualTo(4.5),
      );
      expect(
        _contrastRatio(
          CoreColors.warning,
          CoreColors.amber100,
        ),
        greaterThanOrEqualTo(4.5),
      );
    });

    test('button and tap targets are >= 44x44', () {
      final theme = CoreTheme.light();

      final textButtonMin =
          theme.textButtonTheme.style!.minimumSize?.resolve(<WidgetState>{});
      final iconButtonMin =
          theme.iconButtonTheme.style!.minimumSize?.resolve(<WidgetState>{});
      final filledButtonMin =
          CorePrimaryButton.themeStyle().minimumSize?.resolve(<WidgetState>{});

      expect(textButtonMin?.width ?? 0, greaterThanOrEqualTo(44));
      expect(textButtonMin?.height ?? 0, greaterThanOrEqualTo(44));
      expect(iconButtonMin?.width ?? 0, greaterThanOrEqualTo(44));
      expect(iconButtonMin?.height ?? 0, greaterThanOrEqualTo(44));
      expect(filledButtonMin?.width ?? 0, greaterThanOrEqualTo(44));
      expect(filledButtonMin?.height ?? 0, greaterThanOrEqualTo(44));
    });

    testWidgets('text scale 1.3x remains stable on core screens', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        MediaQuery(
          data: const MediaQueryData(
            textScaler: TextScaler.linear(1.3),
          ),
          child: MaterialApp(
            theme: CoreTheme.light(),
            home: const JoinScreen(selectedRole: JoinRole.passenger),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(tester.takeException(), isNull);
      expect(find.text('Servise Katıl'), findsOneWidget);
      expect(find.text('Koda Katıl'), findsOneWidget);
    });

    testWidgets('small screen (360x800) layout does not overflow', (
      WidgetTester tester,
    ) async {
      tester.view.devicePixelRatio = 1.0;
      tester.view.physicalSize = const Size(360, 800);
      addTearDown(() {
        tester.view.resetDevicePixelRatio();
        tester.view.resetPhysicalSize();
      });

      await tester.pumpWidget(
        MaterialApp(
          theme: CoreTheme.light(),
          home: const PaywallScreen(appName: 'NeredeServis Dev'),
        ),
      );
      await tester.pumpAndSettle();

      expect(tester.takeException(), isNull);
      expect(find.text('Abonelik'), findsOneWidget);
    });

    testWidgets('large screen (430x932) spacing remains stable', (
      WidgetTester tester,
    ) async {
      tester.view.devicePixelRatio = 1.0;
      tester.view.physicalSize = const Size(430, 932);
      addTearDown(() {
        tester.view.resetDevicePixelRatio();
        tester.view.resetPhysicalSize();
      });

      await tester.pumpWidget(
        MaterialApp(
          theme: CoreTheme.light(),
          home: const PaywallScreen(appName: 'NeredeServis Dev'),
        ),
      );
      await tester.pumpAndSettle();

      expect(tester.takeException(), isNull);
      expect(find.text('Abonelik'), findsOneWidget);
    });

    testWidgets('bottom nav remains fixed while body scrolls', (
      WidgetTester tester,
    ) async {
      final navKey = GlobalKey();

      await tester.pumpWidget(
        MaterialApp(
          theme: CoreTheme.light(),
          home: CoreScreenScaffold(
            title: 'Demo',
            scrollable: true,
            bottomNavigationBar: BottomAppBar(
              key: navKey,
              child: const SizedBox(
                height: 56,
                child: Center(child: Text('Bottom Nav')),
              ),
            ),
            body: Column(
              children: List<Widget>.generate(
                30,
                (index) => Padding(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  child: Text('Satir $index'),
                ),
              ),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      final initialTop = tester.getTopLeft(find.byKey(navKey)).dy;

      await tester.drag(find.byType(Scrollable).first, const Offset(0, -600));
      await tester.pumpAndSettle();

      final finalTop = tester.getTopLeft(find.byKey(navKey)).dy;
      expect((finalTop - initialTop).abs(), lessThan(0.1));
      expect(find.text('Bottom Nav'), findsOneWidget);
    });

    testWidgets('join form remains usable when keyboard is open', (
      WidgetTester tester,
    ) async {
      JoinBySrvFormInput? joinedInput;

      await tester.pumpWidget(
        MaterialApp(
          theme: CoreTheme.light(),
          home: MediaQuery(
            data: const MediaQueryData(
              size: Size(360, 800),
              viewInsets: EdgeInsets.only(bottom: 280),
            ),
            child: JoinScreen(
              selectedRole: JoinRole.passenger,
              onJoinByCode: (value) async {
                joinedInput = value;
              },
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      await tester.enterText(find.byType(TextField).at(0), 'SRV23A');
      await tester.enterText(find.byType(TextField).at(1), 'Ali Yolcu');
      await tester.enterText(find.byType(TextField).at(3), 'Darica');
      await tester.ensureVisible(find.text('Koda Katıl'));
      await tester.tap(find.text('Koda Katıl'));
      await tester.pumpAndSettle();

      expect(tester.takeException(), isNull);
      expect(joinedInput, isNotNull);
      expect(joinedInput!.srvCode, 'SRV23A');
    });

    testWidgets('driver active trip contract keeps map + heartbeat + distance',
        (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: CoreTheme.light(),
          home: const ActiveTripScreen(
            nextStopName: 'GOSB Giris',
            crowFlyDistanceMeters: 840,
          ),
        ),
      );
      await tester.pump(const Duration(milliseconds: 500));

      expect(find.text('Arac konumu'), findsOneWidget);
      expect(find.text('YAYINDASIN'), findsOneWidget);
      expect(find.text('Siradaki Durak'), findsOneWidget);
      expect(find.text('840 m'), findsOneWidget);
    }, skip: true);

    testWidgets('heartbeat burn-in micro-shift stays within 3px envelope', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: CoreTheme.light(),
          home: const Scaffold(
            body: Align(
              alignment: Alignment.topLeft,
              child: CoreHeartbeatIndicator(state: HeartbeatState.green),
            ),
          ),
        ),
      );
      await tester.pump();

      final labelFinder = find.text('YAYINDASIN');
      final initialOffset = tester.getTopLeft(labelFinder);

      await tester.pump(CoreHeartbeatIndicator.burnInShiftDuration);
      final shiftedOffset = tester.getTopLeft(labelFinder);

      expect(shiftedOffset.dx - initialOffset.dx, inInclusiveRange(1.0, 3.0));
      expect(shiftedOffset.dy - initialOffset.dy, inInclusiveRange(1.0, 3.0));

      await tester.pump(CoreHeartbeatIndicator.burnInShiftDuration);
      final cycleOffset = tester.getTopLeft(labelFinder);
      expect((cycleOffset.dx - initialOffset.dx).abs(), lessThanOrEqualTo(0.5));
      expect((cycleOffset.dy - initialOffset.dy).abs(), lessThanOrEqualTo(0.5));
    });

    testWidgets('heartbeat burn-in micro-shift long-run remains stable', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: CoreTheme.light(),
          home: const Scaffold(
            body: Align(
              alignment: Alignment.topLeft,
              child: CoreHeartbeatIndicator(state: HeartbeatState.green),
            ),
          ),
        ),
      );

      final labelFinder = find.text('YAYINDASIN');
      final initialOffset = tester.getTopLeft(labelFinder);
      for (var second = 0; second < 180; second++) {
        await tester.pump(const Duration(seconds: 1));
        final offset = tester.getTopLeft(labelFinder);
        expect(offset.dx - initialOffset.dx, inInclusiveRange(0.0, 3.0));
        expect(offset.dy - initialOffset.dy, inInclusiveRange(0.0, 3.0));
        expect(tester.takeException(), isNull);
      }
    });

    testWidgets('driver red heartbeat shows peripheral alarm frame', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: CoreTheme.light(),
          home: const ActiveTripScreen(
            heartbeatState: HeartbeatState.red,
          ),
        ),
      );
      await tester.pump(const Duration(milliseconds: 100));

      expect(
        find.byKey(const Key('active_trip_red_alarm_border')),
        findsOneWidget,
      );
    }, skip: true);

    testWidgets('driver heartbeat recovery shows improvement message', (
      WidgetTester tester,
    ) async {
      var heartbeatState = HeartbeatState.red;
      late StateSetter updateHeartbeatState;

      await tester.pumpWidget(
        MaterialApp(
          theme: CoreTheme.light(),
          home: StatefulBuilder(
            builder: (context, setState) {
              updateHeartbeatState = setState;
              return ActiveTripScreen(heartbeatState: heartbeatState);
            },
          ),
        ),
      );
      await tester.pump(const Duration(milliseconds: 100));

      updateHeartbeatState(() {
        heartbeatState = HeartbeatState.green;
      });
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 200));

      expect(find.text('Baglanti geri geldi.'), findsOneWidget);
    }, skip: true);

    testWidgets('passenger screen keeps single draggable sheet rule', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: CoreTheme.light(),
          home: const PassengerTrackingScreen(),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.byType(DraggableScrollableSheet), findsOneWidget);
    }, skip: true);

    testWidgets('toast/snackbar schema uses frozen warning palette', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: CoreTheme.light(),
          home: Builder(
            builder: (context) {
              return Scaffold(
                body: Center(
                  child: ElevatedButton(
                    onPressed: () {
                      CoreSnackbars.show(
                        context,
                        message: 'Uyari mesaji',
                        tone: CoreSnackbarTone.warning,
                      );
                    },
                    child: const Text('Goster'),
                  ),
                ),
              );
            },
          ),
        ),
      );
      await tester.tap(find.text('Goster'));
      await tester.pump();

      final snackBar = tester.widget<SnackBar>(find.byType(SnackBar));
      expect(snackBar.backgroundColor, CoreColors.warningStrong);
      expect(find.byIcon(CoreIconTokens.warning), findsOneWidget);
      expect(find.text('Uyari mesaji'), findsOneWidget);
    });
  });
}

double _contrastRatio(Color a, Color b) {
  final l1 = _relativeLuminance(a);
  final l2 = _relativeLuminance(b);
  final lighter = l1 > l2 ? l1 : l2;
  final darker = l1 > l2 ? l2 : l1;
  return (lighter + 0.05) / (darker + 0.05);
}

double _relativeLuminance(Color color) {
  return color.computeLuminance();
}
