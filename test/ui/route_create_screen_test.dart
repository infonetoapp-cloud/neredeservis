import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/ui/screens/route_create_screen.dart';
import 'package:neredeservis/ui/theme/theme_amber.dart';

void main() {
  Widget buildTestApp({
    Future<void> Function(RouteCreateFormInput input)? onCreate,
  }) {
    return MaterialApp(
      theme: AmberTheme.light(),
      home: RouteCreateScreen(onCreate: onCreate),
    );
  }

  testWidgets('route create screen renders form sections', (tester) async {
    await tester.pumpWidget(buildTestApp());
    await tester.pumpAndSettle();

    expect(find.text('Rota Olustur'), findsOneWidget);
    expect(find.text('Rota Adi'), findsOneWidget);
    expect(find.text('Baslangic Adresi'), findsOneWidget);
    expect(find.text('Bitis Adresi'), findsOneWidget);
    expect(find.text('Rotayi Olustur'), findsOneWidget);
  });

  testWidgets('route create submit sends normalized payload', (tester) async {
    RouteCreateFormInput? submitted;
    await tester.pumpWidget(
      buildTestApp(
        onCreate: (input) async {
          submitted = input;
        },
      ),
    );
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextField).at(0), 'Darica Sabah');
    await tester.enterText(find.byType(TextField).at(1), 'Darica Merkez');
    await tester.enterText(find.byType(TextField).at(4), 'Gebze OSB');
    await tester.enterText(find.byType(TextField).at(7), '06:45');

    await tester.ensureVisible(find.text('Rotayi Olustur'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Rotayi Olustur'));
    await tester.pumpAndSettle();

    expect(submitted, isNotNull);
    expect(submitted!.name, 'Darica Sabah');
    expect(submitted!.startAddress, 'Darica Merkez');
    expect(submitted!.endAddress, 'Gebze OSB');
    expect(submitted!.scheduledTime, '06:45');
    expect(submitted!.timeSlot, 'morning');
  });
}
