import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/ui/screens/route_create_screen.dart';
import 'package:neredeservis/ui/theme/core_theme.dart';

void main() {
  Widget buildTestApp({
    Future<void> Function(RouteCreateFormInput input)? onCreate,
  }) {
    return MaterialApp(
      theme: CoreTheme.light(),
      home: RouteCreateScreen(
        onCreate: onCreate,
      ),
    );
  }

  testWidgets('route create screen renders quick route form', (tester) async {
    await tester.pumpWidget(buildTestApp());
    await tester.pumpAndSettle();

    expect(find.textContaining('Rota Oluştur'), findsOneWidget);
    expect(find.text('Başlangıç Adresi'), findsOneWidget);
    expect(find.text('Bitiş Adresi'), findsOneWidget);
    expect(find.text('Planlanan Saat'), findsOneWidget);
    expect(find.text('Rotayı Oluştur'), findsOneWidget);
  });

  testWidgets('typing address shows suggestions', (tester) async {
    await tester.pumpWidget(buildTestApp());
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextField).at(1), 'Lev');
    await tester.pumpAndSettle();

    expect(find.text('Levent Metro'), findsWidgets);
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
    await tester.enterText(find.byType(TextField).at(2), 'Gebze OSB');

    await tester.scrollUntilVisible(
      find.text('Rotayı Oluştur'),
      200,
      scrollable: find.byType(Scrollable).first,
    );
    await tester.pumpAndSettle();
    await tester.tap(find.text('Rotayı Oluştur'));
    await tester.pumpAndSettle();

    expect(submitted, isNotNull);
    expect(submitted!.name, 'Darica Sabah');
    expect(submitted!.startAddress, 'Darica Merkez');
    expect(submitted!.endAddress, 'Gebze OSB');
    expect(submitted!.scheduledTime, '07:00');
    expect(submitted!.timeSlot, 'morning');
    expect(submitted!.startLat, inInclusiveRange(-90, 90));
    expect(submitted!.startLng, inInclusiveRange(-180, 180));
    expect(submitted!.endLat, inInclusiveRange(-90, 90));
    expect(submitted!.endLng, inInclusiveRange(-180, 180));
  });
}
