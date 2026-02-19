import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/ui/screens/stop_crud_screen.dart';
import 'package:neredeservis/ui/theme/theme_amber.dart';

void main() {
  Widget buildTestApp({
    Future<void> Function(StopUpsertFormInput input)? onUpsert,
    Future<void> Function(StopDeleteFormInput input)? onDelete,
  }) {
    return MaterialApp(
      theme: AmberTheme.light(),
      home: StopCrudScreen(
        onUpsert: onUpsert,
        onDelete: onDelete,
      ),
    );
  }

  testWidgets('stop crud screen renders forms and actions', (tester) async {
    await tester.pumpWidget(buildTestApp());
    await tester.pumpAndSettle();

    expect(find.text('Durak CRUD'), findsOneWidget);
    expect(find.text('Route ID (zorunlu)'), findsOneWidget);
    expect(find.text('Stop ID (upsert icin opsiyonel, silme icin zorunlu)'),
        findsOneWidget);
    expect(find.text('Duragi Kaydet / Guncelle'), findsOneWidget);
    expect(find.text('Duragi Sil'), findsOneWidget);
  });

  testWidgets('stop upsert submits callable payload', (tester) async {
    StopUpsertFormInput? upserted;

    await tester.pumpWidget(
      buildTestApp(
        onUpsert: (input) async {
          upserted = input;
        },
      ),
    );
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextField).at(0), 'route_123');
    await tester.enterText(find.byType(TextField).at(1), 'stop_1');
    await tester.enterText(find.byType(TextField).at(2), 'Durak A');
    await tester.enterText(find.byType(TextField).at(3), '40.7700');
    await tester.enterText(find.byType(TextField).at(4), '29.4000');
    await tester.enterText(find.byType(TextField).at(5), '2');

    await tester.tap(find.text('Duragi Kaydet / Guncelle'));
    await tester.pumpAndSettle();

    expect(upserted, isNotNull);
    expect(upserted!.routeId, equals('route_123'));
    expect(upserted!.stopId, equals('stop_1'));
    expect(upserted!.name, equals('Durak A'));
    expect(upserted!.order, equals(2));
  });

  testWidgets('stop delete validates stop id', (tester) async {
    await tester.pumpWidget(buildTestApp());
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextField).at(0), 'route_123');
    await tester.tap(find.text('Duragi Sil'));
    await tester.pumpAndSettle();

    expect(find.text('Silme icin Stop ID zorunlu.'), findsOneWidget);
  });

  testWidgets('stop delete submits callable payload', (tester) async {
    StopDeleteFormInput? deleted;

    await tester.pumpWidget(
      buildTestApp(
        onDelete: (input) async {
          deleted = input;
        },
      ),
    );
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextField).at(0), 'route_123');
    await tester.enterText(find.byType(TextField).at(1), 'stop_1');

    await tester.tap(find.text('Duragi Sil'));
    await tester.pumpAndSettle();

    expect(deleted, isNotNull);
    expect(deleted!.routeId, equals('route_123'));
    expect(deleted!.stopId, equals('stop_1'));
  });
}
