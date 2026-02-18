import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/ui/screens/role_select_screen.dart';
import 'package:neredeservis/ui/theme/theme_amber.dart';

void main() {
  testWidgets('role select screen renders two clear role paths', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: AmberTheme.light(),
        home: const RoleSelectScreen(
          appName: 'NeredeServis Dev',
        ),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('Devam etmek icin rolunu sec'), findsOneWidget);
    expect(find.text('Sofor Olarak Devam Et'), findsOneWidget);
    expect(find.text('Yolcu Olarak Devam Et'), findsOneWidget);
  });

  testWidgets('role select actions trigger callbacks', (
    WidgetTester tester,
  ) async {
    var driverTapped = false;
    var passengerTapped = false;

    await tester.pumpWidget(
      MaterialApp(
        theme: AmberTheme.light(),
        home: RoleSelectScreen(
          appName: 'NeredeServis Dev',
          onDriverTap: () {
            driverTapped = true;
          },
          onPassengerTap: () {
            passengerTapped = true;
          },
        ),
      ),
    );

    await tester.tap(find.text('Sofor Olarak Devam Et'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Yolcu Olarak Devam Et'));
    await tester.pumpAndSettle();

    expect(driverTapped, isTrue);
    expect(passengerTapped, isTrue);
  });
}
