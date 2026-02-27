import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/ui/screens/passenger_settings_screen.dart';
import 'package:neredeservis/ui/tokens/form_validation_tokens.dart';
import 'package:neredeservis/ui/theme/core_theme.dart';

void main() {
  Widget buildTestApp({
    String routeId = 'route_123',
    String? routeName = 'Darica -> GOSB',
    Future<void> Function(PassengerSettingsFormInput input)? onSave,
  }) {
    return MaterialApp(
      theme: CoreTheme.light(),
      home: PassengerSettingsScreen(
        routeId: routeId,
        routeName: routeName,
        onSave: onSave,
      ),
    );
  }

  testWidgets('passenger settings screen renders core fields', (tester) async {
    await tester.pumpWidget(buildTestApp());
    await tester.pumpAndSettle();

    expect(find.text('Yolcu Ayarları'), findsOneWidget);
    expect(find.text('Telefon (opsiyonel)'), findsOneWidget);
    expect(find.text('Biniş Alanı'), findsOneWidget);
    expect(find.text('Bildirim Saati (HH:mm)'), findsOneWidget);
    expect(find.text('Sanal Durak kullan (opsiyonel)'), findsOneWidget);
    expect(find.text('Ayarlarımı Kaydet'), findsOneWidget);
  });

  testWidgets('passenger settings validates required fields', (tester) async {
    await tester.pumpWidget(buildTestApp());
    await tester.pumpAndSettle();

    await tester.tap(find.text('Ayarlarımı Kaydet'));
    await tester.pumpAndSettle();

    expect(
      find.text(CoreFormValidationTokens.boardingAreaRequired),
      findsOneWidget,
    );
  });

  testWidgets('passenger settings submits payload with virtual stop', (
    tester,
  ) async {
    PassengerSettingsFormInput? submitted;
    await tester.pumpWidget(
      buildTestApp(
        onSave: (input) async {
          submitted = input;
        },
      ),
    );
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextField).at(1), '5551112233');
    await tester.enterText(find.byType(TextField).at(2), 'Durak B');
    await tester.enterText(find.byType(TextField).at(3), '07:10');

    await tester.tap(find.text('Sanal Durak kullan (opsiyonel)'));
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextField).at(4), 'Market Onu');
    await tester.enterText(find.byType(TextField).at(5), '40.8123');
    await tester.enterText(find.byType(TextField).at(6), '29.4123');

    await tester.ensureVisible(find.text('Ayarlarımı Kaydet'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Ayarlarımı Kaydet'));
    await tester.pumpAndSettle();

    expect(submitted, isNotNull);
    expect(submitted!.routeId, equals('route_123'));
    expect(submitted!.phone, equals('5551112233'));
    expect(submitted!.boardingArea, equals('Durak B'));
    expect(submitted!.notificationTime, equals('07:10'));
    expect(submitted!.virtualStop, isNotNull);
    expect(submitted!.virtualStop!.lat, closeTo(40.8123, 0.00001));
    expect(submitted!.virtualStop!.lng, closeTo(29.4123, 0.00001));
    expect(submitted!.virtualStopLabel, equals('Market Onu'));
  });
}
