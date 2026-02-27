import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/ui/screens/driver_route_management_screen.dart';
import 'package:neredeservis/ui/theme/core_theme.dart';

void main() {
  Widget buildTestApp({
    VoidCallback? onCreateRouteTap,
    VoidCallback? onUpdateRouteTap,
    VoidCallback? onManageStopsTap,
  }) {
    return MaterialApp(
      theme: CoreTheme.light(),
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

    expect(find.text('Rota Merkezi'), findsOneWidget);
    expect(find.widgetWithText(FilledButton, 'Hızlı Başlat'), findsOneWidget);
    expect(
      find.widgetWithText(OutlinedButton, 'Rota Güncelle'),
      findsOneWidget,
    );
    expect(find.widgetWithText(OutlinedButton, 'Durakları Aç'), findsOneWidget);
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

    final quickStartButton = find.widgetWithText(FilledButton, 'Hızlı Başlat');
    final updateButton = find.widgetWithText(OutlinedButton, 'Rota Güncelle');
    final manageStopsButton =
        find.widgetWithText(OutlinedButton, 'Durakları Aç');

    await tester.ensureVisible(quickStartButton);
    await tester.tap(quickStartButton);
    await tester.pumpAndSettle();
    await tester.ensureVisible(updateButton);
    await tester.tap(updateButton);
    await tester.pumpAndSettle();
    await tester.ensureVisible(manageStopsButton);
    await tester.tap(manageStopsButton);
    await tester.pumpAndSettle();

    expect(createTapped, isTrue);
    expect(updateTapped, isTrue);
    expect(stopsTapped, isTrue);
  });
}
