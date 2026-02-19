import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/ui/screens/driver_route_management_screen.dart';
import 'package:neredeservis/ui/theme/theme_amber.dart';

void main() {
  Widget buildTestApp({
    VoidCallback? onCreateRouteTap,
    VoidCallback? onUpdateRouteTap,
    VoidCallback? onManageStopsTap,
  }) {
    return MaterialApp(
      theme: AmberTheme.light(),
      home: DriverRouteManagementScreen(
        onCreateRouteTap: onCreateRouteTap,
        onUpdateRouteTap: onUpdateRouteTap,
        onManageStopsTap: onManageStopsTap,
      ),
    );
  }

  testWidgets('driver route management renders all action buttons',
      (tester) async {
    await tester.pumpWidget(buildTestApp());
    await tester.pumpAndSettle();

    expect(find.text('Rota Yonetimi'), findsOneWidget);
    expect(find.text('Yeni Rota Olustur'), findsOneWidget);
    expect(find.text('Route Guncelle Ekrani'), findsOneWidget);
    expect(find.text('Durak CRUD Ekrani'), findsOneWidget);
  });

  testWidgets('driver route management triggers callbacks', (tester) async {
    var createTapped = false;
    var updateTapped = false;
    var stopsTapped = false;

    await tester.pumpWidget(
      buildTestApp(
        onCreateRouteTap: () => createTapped = true,
        onUpdateRouteTap: () => updateTapped = true,
        onManageStopsTap: () => stopsTapped = true,
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.text('Yeni Rota Olustur'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Route Guncelle Ekrani'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Durak CRUD Ekrani'));
    await tester.pumpAndSettle();

    expect(createTapped, isTrue);
    expect(updateTapped, isTrue);
    expect(stopsTapped, isTrue);
  });
}
