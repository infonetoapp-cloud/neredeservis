import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/ui/screens/join_screen.dart';
import 'package:neredeservis/ui/theme/theme_amber.dart';

void main() {
  Widget buildTestApp({
    JoinRole role = JoinRole.unknown,
    Future<void> Function(JoinBySrvFormInput input)? onJoinByCode,
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
    expect(find.text('Ad Soyad'), findsOneWidget);
    expect(find.text('Binis Alani'), findsOneWidget);
    expect(find.text('Bildirim Saati (HH:mm)'), findsOneWidget);
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
    JoinBySrvFormInput? joinedInput;
    var qrTapped = false;
    var driverQuickTapped = false;

    await tester.pumpWidget(
      buildTestApp(
        role: JoinRole.driver,
        onJoinByCode: (value) async {
          joinedInput = value;
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

    await tester.enterText(find.byType(TextField).at(0), 'SRV-8K2Q7M');
    await tester.enterText(find.byType(TextField).at(1), 'Ali Yilmaz');
    await tester.enterText(find.byType(TextField).at(3), 'Darica Merkez');
    await tester.tap(find.text('Koda Katil'));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('QR Tara'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('QR Tara'));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('Sofor Paneline Gec'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Sofor Paneline Gec'));
    await tester.pumpAndSettle();

    expect(joinedInput, isNotNull);
    expect(joinedInput!.srvCode, equals('8K2Q7M'));
    expect(joinedInput!.name, equals('Ali Yilmaz'));
    expect(joinedInput!.boardingArea, equals('Darica Merkez'));
    expect(qrTapped, isTrue);
    expect(driverQuickTapped, isTrue);
  });

  testWidgets('join screen shows guest mode label',
      (WidgetTester tester) async {
    await tester.pumpWidget(buildTestApp(role: JoinRole.guest));
    await tester.pumpAndSettle();

    expect(find.text('Misafir modu secili'), findsOneWidget);
    expect(find.text('Sofor Paneline Gec'), findsNothing);
  });
}
