import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/ui/screens/route_update_screen.dart';
import 'package:neredeservis/ui/theme/theme_amber.dart';

void main() {
  Widget buildTestApp({
    Future<void> Function(RouteUpdateFormInput input)? onSubmit,
  }) {
    return MaterialApp(
      theme: AmberTheme.light(),
      home: RouteUpdateScreen(onSubmit: onSubmit),
    );
  }

  testWidgets('route update screen renders core inputs', (tester) async {
    await tester.pumpWidget(buildTestApp());
    await tester.pumpAndSettle();

    expect(find.text('Route Guncelle'), findsOneWidget);
    expect(find.text('Route ID (zorunlu)'), findsOneWidget);
    expect(find.text('Rota Adi (opsiyonel)'), findsOneWidget);
    expect(find.text('Guncellemeyi Kaydet'), findsOneWidget);
  });

  testWidgets('route update validates route id', (tester) async {
    await tester.pumpWidget(buildTestApp());
    await tester.pumpAndSettle();

    await tester.ensureVisible(find.text('Guncellemeyi Kaydet'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Guncellemeyi Kaydet'));
    await tester.pumpAndSettle();

    expect(find.text('Route ID zorunlu.'), findsOneWidget);
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
    await tester.enterText(find.byType(TextField).at(3), '40.7700');
    await tester.enterText(find.byType(TextField).at(4), '29.4000');
    await tester.enterText(find.byType(TextField).at(8), '06:45');

    await tester.ensureVisible(find.text('Guncellemeyi Kaydet'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Guncellemeyi Kaydet'));
    await tester.pumpAndSettle();

    expect(submitted, isNotNull);
    expect(submitted!.routeId, equals('route_123'));
    expect(submitted!.name, equals('Sabah Servisi'));
    expect(submitted!.scheduledTime, equals('06:45'));
    expect(submitted!.startPoint, isNotNull);
    expect(submitted!.startPoint!.lat, closeTo(40.77, 0.00001));
    expect(submitted!.startPoint!.lng, closeTo(29.4, 0.00001));
  });
}
