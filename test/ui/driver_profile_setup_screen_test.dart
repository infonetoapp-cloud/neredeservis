import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/ui/screens/driver_profile_setup_screen.dart';
import 'package:neredeservis/ui/theme/theme_amber.dart';

void main() {
  Widget buildTestApp({
    Future<void> Function(
      String name,
      String phone,
      String plate,
      bool showPhoneToPassengers,
    )? onSave,
  }) {
    return MaterialApp(
      theme: AmberTheme.light(),
      home: DriverProfileSetupScreen(
        onSave: onSave,
      ),
    );
  }

  testWidgets('driver profile setup renders core fields', (tester) async {
    await tester.pumpWidget(buildTestApp());
    await tester.pumpAndSettle();

    expect(find.text('Sofor Profili'), findsOneWidget);
    expect(find.text('Ad Soyad'), findsOneWidget);
    expect(find.text('Telefon'), findsOneWidget);
    expect(find.text('Plaka'), findsOneWidget);
    expect(find.text('Profili Kaydet'), findsOneWidget);
  });

  testWidgets(
      'driver profile setup save triggers callback with normalized plate', (
    tester,
  ) async {
    String? savedName;
    String? savedPhone;
    String? savedPlate;
    bool? savedShowPhone;

    await tester.pumpWidget(
      buildTestApp(
        onSave: (name, phone, plate, showPhoneToPassengers) async {
          savedName = name;
          savedPhone = phone;
          savedPlate = plate;
          savedShowPhone = showPhoneToPassengers;
        },
      ),
    );
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextField).at(0), 'Ali Yilmaz');
    await tester.enterText(find.byType(TextField).at(1), '5551112233');
    await tester.enterText(find.byType(TextField).at(2), '34 abc 123');
    await tester.tap(find.text('Profili Kaydet'));
    await tester.pumpAndSettle();

    expect(savedName, 'Ali Yilmaz');
    expect(savedPhone, '5551112233');
    expect(savedPlate, '34 ABC 123');
    expect(savedShowPhone, isTrue);
  });
}
