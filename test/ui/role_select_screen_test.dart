import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/ui/screens/role_select_screen.dart';
import 'package:neredeservis/ui/theme/core_theme.dart';

void main() {
  testWidgets('role select screen renders three clear role paths', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: CoreTheme.light(),
        home: const RoleSelectScreen(appName: 'NeredeServis Dev'),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('Nas\u0131l Devam Etmek\n\u0130stersin?'), findsOneWidget);
    expect(find.text('\u015eof\u00f6r Olarak Devam Et'), findsOneWidget);
    expect(find.text('Yolcu Olarak Devam Et'), findsOneWidget);
    expect(find.text('Misafir Olarak Devam Et'), findsOneWidget);
  });

  testWidgets('role select actions trigger callbacks', (
    WidgetTester tester,
  ) async {
    var driverTapped = false;
    var passengerTapped = false;
    var guestTapped = false;

    await tester.pumpWidget(
      MaterialApp(
        theme: CoreTheme.light(),
        home: RoleSelectScreen(
          appName: 'NeredeServis Dev',
          onDriverTap: () {
            driverTapped = true;
          },
          onPassengerTap: () {
            passengerTapped = true;
          },
          onGuestTap: () {
            guestTapped = true;
          },
        ),
      ),
    );

    await tester.ensureVisible(find.text('\u015eof\u00f6r Olarak Devam Et'));
    await tester.tap(find.text('\u015eof\u00f6r Olarak Devam Et'));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('Yolcu Olarak Devam Et'));
    await tester.tap(find.text('Yolcu Olarak Devam Et'));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('Misafir Olarak Devam Et'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Misafir Olarak Devam Et'));
    await tester.pumpAndSettle();

    expect(driverTapped, isTrue);
    expect(passengerTapped, isTrue);
    expect(guestTapped, isTrue);
  });

  testWidgets('role cards are directly tappable', (WidgetTester tester) async {
    var driverTapped = false;
    var passengerTapped = false;
    var guestTapped = false;

    await tester.pumpWidget(
      MaterialApp(
        theme: CoreTheme.light(),
        home: RoleSelectScreen(
          appName: 'NeredeServis Dev',
          onDriverTap: () {
            driverTapped = true;
          },
          onPassengerTap: () {
            passengerTapped = true;
          },
          onGuestTap: () {
            guestTapped = true;
          },
        ),
      ),
    );

    await tester.tap(find.text('\u015eof\u00f6r'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Yolcu'));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('Misafir'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Misafir'));
    await tester.pumpAndSettle();

    expect(driverTapped, isTrue);
    expect(passengerTapped, isTrue);
    expect(guestTapped, isTrue);
  });
}
