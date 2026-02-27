import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/ui/screens/route_update_screen.dart';
import 'package:neredeservis/ui/tokens/form_validation_tokens.dart';
import 'package:neredeservis/ui/theme/core_theme.dart';

void main() {
  Widget buildTestApp({
    Future<void> Function(RouteUpdateFormInput input)? onSubmit,
  }) {
    return MaterialApp(
      theme: CoreTheme.light(),
      home: RouteUpdateScreen(onSubmit: onSubmit),
    );
  }

  testWidgets('route update screen renders core inputs', (tester) async {
    await tester.pumpWidget(buildTestApp());
    await tester.pumpAndSettle();

    expect(find.textContaining('Rota'), findsWidgets);
    expect(find.text('Rota Kodu'), findsOneWidget);
    expect(find.textContaining('Rota ddi (istege bagli)'), findsOneWidget);
    expect(find.textContaining('Kaydet'), findsOneWidget);
  });

  testWidgets('route update validates route id', (tester) async {
    await tester.pumpWidget(buildTestApp());
    await tester.pumpAndSettle();

    await tester.scrollUntilVisible(
      find.textContaining('Kaydet'),
      200,
      scrollable: find.byType(Scrollable).first,
    );
    await tester.pumpAndSettle();
    await tester.tap(find.textContaining('Kaydet'));
    await tester.pumpAndSettle();

    expect(find.text(CoreFormValidationTokens.routeIdRequired), findsOneWidget);
  });

  testWidgets('route update submits payload when valid', (tester) async {
    RouteUpdateFormInput? submitted;

    await tester.pumpWidget(
      buildTestApp(
        onSubmit: (input) async {
          submitted = input;
        },
      ),
    );
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextField).at(0), 'route_123');
    await tester.enterText(find.byType(TextField).at(1), 'Sabah Servisi');
    await tester.enterText(find.byType(TextField).at(2), '06:45');
    await tester.enterText(find.byType(TextField).at(3), 'Levent Metro');

    final saveButton = find.byWidgetPredicate(
      (widget) =>
          widget is FilledButton &&
          widget.child is Text &&
          (((widget.child as Text).data ?? '').contains('Kaydet')),
    );

    await tester.drag(find.byType(Scrollable).first, const Offset(0, -1200));
    await tester.pumpAndSettle();
    await tester.drag(find.byType(Scrollable).last, const Offset(0, -1200));
    await tester.pumpAndSettle();
    expect(saveButton.hitTestable(), findsOneWidget);
    await tester.tap(saveButton);
    await tester.pumpAndSettle();

    expect(submitted, isNotNull);
    expect(submitted!.routeId, equals('route_123'));
    expect(submitted!.name, equals('Sabah Servisi'));
    expect(submitted!.scheduledTime, equals('06:45'));
    expect(submitted!.startPoint, isNotNull);
    expect(submitted!.startPoint!.lat, inInclusiveRange(-90, 90));
    expect(submitted!.startPoint!.lng, inInclusiveRange(-180, 180));
  });
}
