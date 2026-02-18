import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/ui/screens/join_screen.dart';
import 'package:neredeservis/ui/theme/theme_amber.dart';

void main() {
  Widget buildTestApp({
    JoinRole role = JoinRole.unknown,
    ValueChanged<String>? onJoinByCode,
    VoidCallback? onScanQrTap,
    VoidCallback? onContinueDriverTap,
  }) {
    return MaterialApp(
      theme: AmberTheme.light(),
      home: JoinScreen(
        selectedRole: role,
        onJoinByCode: onJoinByCode,
        onScanQrTap: onScanQrTap,
        onContinueDriverTap: onContinueDriverTap,
      ),
    );
  }

  testWidgets('join screen renders SRV and QR actions', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(buildTestApp());
    await tester.pumpAndSettle();

    expect(find.text('Servise Katil'), findsOneWidget);
    expect(find.text('SRV Kodu'), findsOneWidget);
    expect(find.text('Koda Katil'), findsOneWidget);
    expect(find.text('QR Tara'), findsOneWidget);
  });

  testWidgets('join screen validates empty code', (WidgetTester tester) async {
    await tester.pumpWidget(buildTestApp());
    await tester.pumpAndSettle();

    await tester.tap(find.text('Koda Katil'));
    await tester.pumpAndSettle();

    expect(find.text('SRV kodu gir.'), findsOneWidget);
  });

  testWidgets('join actions trigger callbacks', (WidgetTester tester) async {
    String? joinedCode;
    var qrTapped = false;
    var driverQuickTapped = false;

    await tester.pumpWidget(
      buildTestApp(
        role: JoinRole.driver,
        onJoinByCode: (value) {
          joinedCode = value;
        },
        onScanQrTap: () {
          qrTapped = true;
        },
        onContinueDriverTap: () {
          driverQuickTapped = true;
        },
      ),
    );
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextField), 'SRV-8K2Q');
    await tester.tap(find.text('Koda Katil'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('QR Tara'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Sofor Paneline Gec'));
    await tester.pumpAndSettle();

    expect(joinedCode, equals('SRV-8K2Q'));
    expect(qrTapped, isTrue);
    expect(driverQuickTapped, isTrue);
  });
}
