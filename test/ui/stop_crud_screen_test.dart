import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/ui/screens/stop_crud_screen.dart';
import 'package:neredeservis/ui/tokens/form_validation_tokens.dart';
import 'package:neredeservis/ui/theme/core_theme.dart';

void main() {
  Widget buildTestApp({
    Future<void> Function(StopUpsertFormInput input)? onUpsert,
    Future<void> Function(StopDeleteFormInput input)? onDelete,
  }) {
    return MaterialApp(
      theme: CoreTheme.light(),
      home: StopCrudScreen(
        onUpsert: onUpsert,
        onDelete: onDelete,
      ),
    );
  }

  testWidgets('stop management screen renders forms and actions',
      (tester) async {
    await tester.pumpWidget(buildTestApp());
    await tester.pumpAndSettle();

    expect(find.textContaining('Yönet'), findsOneWidget);
    expect(find.text('Rota Kodu (zorunlu)'), findsOneWidget);
    expect(find.text('Durak Kodu (düzenleme/silme için)'), findsOneWidget);
    expect(find.text('Durağı Kaydet / Güncelle'), findsOneWidget);
    expect(find.text('Durağı Sil'), findsOneWidget);
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
    await tester.enterText(find.byType(TextField).at(3), 'Levent Metro');
    await tester.enterText(find.byType(TextField).at(4), '2');

    await tester.scrollUntilVisible(
      find.text('Durağı Kaydet / Güncelle'),
      200,
      scrollable: find.byType(Scrollable).first,
    );
    await tester.tap(find.text('Durağı Kaydet / Güncelle'));
    await tester.pumpAndSettle();

    expect(upserted, isNotNull);
    expect(upserted!.routeId, equals('route_123'));
    expect(upserted!.stopId, equals('stop_1'));
    expect(upserted!.name, equals('Durak A'));
    expect(upserted!.order, equals(2));
    expect(upserted!.lat, inInclusiveRange(-90, 90));
    expect(upserted!.lng, inInclusiveRange(-180, 180));
  });

  testWidgets('stop delete validates stop id', (tester) async {
    await tester.pumpWidget(buildTestApp());
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextField).at(0), 'route_123');
    await tester.scrollUntilVisible(
      find.text('Durağı Sil'),
      200,
      scrollable: find.byType(Scrollable).first,
    );
    await tester.tap(find.text('Durağı Sil'));
    await tester.pumpAndSettle();

    expect(find.text(CoreFormValidationTokens.stopIdRequiredForDelete), findsOneWidget);
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

    await tester.scrollUntilVisible(
      find.text('Durağı Sil'),
      200,
      scrollable: find.byType(Scrollable).first,
    );
    await tester.tap(find.text('Durağı Sil'));
    await tester.pumpAndSettle();

    expect(deleted, isNotNull);
    expect(deleted!.routeId, equals('route_123'));
    expect(deleted!.stopId, equals('stop_1'));
  });
}
