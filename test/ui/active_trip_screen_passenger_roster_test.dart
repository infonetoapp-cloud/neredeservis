import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/ui/screens/active_trip_screen.dart';
import 'package:neredeservis/ui/theme/core_theme.dart';

void main() {
  Widget buildApp({
    required List<ActiveTripPassengerEntry> passengerEntries,
  }) {
    return MaterialApp(
      theme: CoreTheme.light(),
      home: ActiveTripScreen(
        passengerEntries: passengerEntries,
      ),
    );
  }

  testWidgets(
    'driver roster puts skip-today passengers at bottom with strikethrough',
    (WidgetTester tester) async {
      await tester.pumpWidget(
        buildApp(
          passengerEntries: const <ActiveTripPassengerEntry>[
            ActiveTripPassengerEntry(name: 'Ayse', isSkipToday: false),
            ActiveTripPassengerEntry(name: 'Burak', isSkipToday: true),
          ],
        ),
      );
      await tester.pump(const Duration(milliseconds: 300));

      expect(find.text('Yolcu Listesi'), findsOneWidget);
      expect(find.text('Ayse'), findsOneWidget);
      expect(find.text('Burak'), findsOneWidget);
      expect(find.textContaining('yok'), findsOneWidget);

      final activeY = tester.getTopLeft(find.text('Ayse')).dy;
      final skippedY = tester.getTopLeft(find.text('Burak')).dy;
      expect(activeY, lessThan(skippedY));

      final skippedText = tester.widget<Text>(find.text('Burak'));
      expect(skippedText.style?.decoration, isNot(TextDecoration.lineThrough));
    },
  );

  testWidgets(
    'driver roster card stays hidden when there are no passengers',
    (WidgetTester tester) async {
      await tester.pumpWidget(
        buildApp(passengerEntries: const <ActiveTripPassengerEntry>[]),
      );
      await tester.pump(const Duration(milliseconds: 300));

      expect(find.text('Yolcu Listesi'), findsOneWidget);
      expect(find.textContaining('Yolcu bilgisi yok'), findsOneWidget);
    },
  );
}
