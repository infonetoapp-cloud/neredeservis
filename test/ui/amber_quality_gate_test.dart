import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/ui/components/buttons/amber_buttons.dart';
import 'package:neredeservis/ui/components/feedback/amber_snackbars.dart';
import 'package:neredeservis/ui/components/layout/amber_screen_scaffold.dart';
import 'package:neredeservis/ui/screens/active_trip_screen.dart';
import 'package:neredeservis/ui/screens/join_screen.dart';
import 'package:neredeservis/ui/screens/passenger_tracking_screen.dart';
import 'package:neredeservis/ui/screens/paywall_screen.dart';
import 'package:neredeservis/ui/theme/theme_amber.dart';
import 'package:neredeservis/ui/tokens/color_tokens.dart';
import 'package:neredeservis/ui/tokens/icon_tokens.dart';

void main() {
  group('Amber quality gate', () {
    test('core color pairs pass WCAG AA contrast', () {
      expect(
        _contrastRatio(AmberColorTokens.ink900, AmberColorTokens.surface0),
        greaterThanOrEqualTo(4.5),
      );
      expect(
        _contrastRatio(AmberColorTokens.amber500, AmberColorTokens.ink900),
        greaterThanOrEqualTo(4.5),
      );
      expect(
        _contrastRatio(
            AmberColorTokens.dangerStrong, AmberColorTokens.surface0),
        greaterThanOrEqualTo(4.5),
      );
      expect(
        _contrastRatio(
          AmberColorTokens.warning,
          AmberColorTokens.amber100,
        ),
        greaterThanOrEqualTo(4.5),
      );
    });

    test('button and tap targets are >= 44x44', () {
      final theme = AmberTheme.light();

      final textButtonMin =
          theme.textButtonTheme.style!.minimumSize?.resolve(<WidgetState>{});
      final iconButtonMin =
          theme.iconButtonTheme.style!.minimumSize?.resolve(<WidgetState>{});
      final filledButtonMin =
          AmberPrimaryButton.themeStyle().minimumSize?.resolve(<WidgetState>{});

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
            theme: AmberTheme.light(),
            home: const JoinScreen(selectedRole: JoinRole.passenger),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(tester.takeException(), isNull);
      expect(find.text('Servise Katil'), findsOneWidget);
      expect(find.text('Koda Katil'), findsOneWidget);
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
          theme: AmberTheme.light(),
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
          theme: AmberTheme.light(),
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
          theme: AmberTheme.light(),
          home: AmberScreenScaffold(
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
          theme: AmberTheme.light(),
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
      await tester.ensureVisible(find.text('Koda Katil'));
      await tester.tap(find.text('Koda Katil'));
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
          theme: AmberTheme.light(),
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
    });

    testWidgets('passenger screen keeps single draggable sheet rule', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: AmberTheme.light(),
          home: const PassengerTrackingScreen(),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.byType(DraggableScrollableSheet), findsOneWidget);
    });

    testWidgets('toast/snackbar schema uses frozen warning palette', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: AmberTheme.light(),
          home: Builder(
            builder: (context) {
              return Scaffold(
                body: Center(
                  child: ElevatedButton(
                    onPressed: () {
                      AmberSnackbars.show(
                        context,
                        message: 'Uyari mesaji',
                        tone: AmberSnackbarTone.warning,
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
      expect(snackBar.backgroundColor, AmberColorTokens.warningStrong);
      expect(find.byIcon(AmberIconTokens.warning), findsOneWidget);
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
