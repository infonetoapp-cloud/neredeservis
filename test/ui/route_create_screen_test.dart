import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/ui/screens/route_create_screen.dart';
import 'package:neredeservis/ui/theme/theme_amber.dart';

void main() {
  Widget buildTestApp({
    Future<void> Function(RouteCreateFormInput input)? onCreate,
    Future<void> Function(RouteCreateGhostFormInput input)?
        onCreateFromGhostDrive,
  }) {
    return MaterialApp(
      theme: AmberTheme.light(),
      home: RouteCreateScreen(
        onCreate: onCreate,
        onCreateFromGhostDrive: onCreateFromGhostDrive,
      ),
    );
  }

  testWidgets('route create screen renders form sections', (tester) async {
    await tester.pumpWidget(buildTestApp());
    await tester.pumpAndSettle();

    expect(find.text('Rota Olustur'), findsOneWidget);
    expect(find.text('Hizli (pin)'), findsOneWidget);
    expect(find.text('Ghost Drive'), findsOneWidget);
    expect(find.text('Rota Adi'), findsOneWidget);
    expect(find.text('Baslangic Adresi'), findsOneWidget);
    expect(find.text('Bitis Adresi'), findsOneWidget);
    expect(find.text('Rotayi Olustur'), findsOneWidget);
  });

  testWidgets('route create supports quick pin and ghost drive mode switch', (
    tester,
  ) async {
    await tester.pumpWidget(buildTestApp());
    await tester.pumpAndSettle();

    await tester.tap(find.text('Ghost Drive'));
    await tester.pumpAndSettle();

    expect(
      find.textContaining('Ghost Drive kaydinda adimlar'),
      findsOneWidget,
    );
    expect(find.text('Ghost Drive Ile Kaydet'), findsOneWidget);
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

  testWidgets('ghost drive start/stop/preview/save flow triggers callback', (
    tester,
  ) async {
    RouteCreateGhostFormInput? submitted;
    await tester.pumpWidget(
      buildTestApp(
        onCreateFromGhostDrive: (input) async {
          submitted = input;
        },
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.text('Ghost Drive'));
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextField).at(0), 'Ghost Rota');
    await tester.tap(find.text('Kaydi Baslat'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Kaydi Bitir'));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('Onizleme'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Onizleme'));
    await tester.pumpAndSettle();
    await tester.ensureVisible(
      find.text('Otomatik baslangic/bitis ve durak onerilerini onayliyorum'),
    );
    await tester.pumpAndSettle();
    await tester.tap(
      find.text('Otomatik baslangic/bitis ve durak onerilerini onayliyorum'),
    );
    await tester.pumpAndSettle();

    await tester.ensureVisible(find.text('Ghost Drive Ile Kaydet'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Ghost Drive Ile Kaydet'));
    await tester.pumpAndSettle();

    expect(submitted, isNotNull);
    expect(submitted!.name, 'Ghost Rota');
    expect(submitted!.tracePoints.length, greaterThanOrEqualTo(2));
  });
}
