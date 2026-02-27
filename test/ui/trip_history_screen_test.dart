import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/ui/screens/trip_history_screen.dart';
import 'package:neredeservis/ui/theme/core_theme.dart';

void main() {
  Widget buildTestApp({
    required Future<List<TripHistoryItem>> Function() loadItems,
    TripHistoryAudience audience = TripHistoryAudience.passenger,
    ValueChanged<TripHistoryItem>? onDetailTap,
  }) {
    return MaterialApp(
      theme: CoreTheme.light(),
      home: TripHistoryScreen(
        audience: audience,
        loadItems: loadItems,
        onDetailTap: onDetailTap,
      ),
    );
  }

  testWidgets('renders list items and triggers detail callback', (
    WidgetTester tester,
  ) async {
    var detailTapCount = 0;
    await tester.pumpWidget(
      buildTestApp(
        loadItems: () async => <TripHistoryItem>[
          TripHistoryItem(
            tripId: 'trip_1',
            routeId: 'route_1',
            routeName: 'Maslak - Besiktas',
            referenceAtUtc: DateTime.utc(2026, 2, 12, 6, 40),
            counterpartLabel: 'Sofor: Ahmet Yilmaz',
            status: TripHistoryStatus.completed,
            durationMinutes: 45,
          ),
        ],
        onDetailTap: (_) {
          detailTapCount++;
        },
      ),
    );
    await tester.pumpAndSettle();

    expect(find.textContaining('Sefer'), findsOneWidget);
    expect(find.text('Maslak - Besiktas'), findsOneWidget);
    expect(find.text('45 dk'), findsOneWidget);
    expect(find.text('TAMAMLANDI'), findsOneWidget);
    expect(find.textContaining('Detay'), findsOneWidget);

    await tester.tap(find.textContaining('Detay').first);
    await tester.pumpAndSettle();
    expect(detailTapCount, 1);
  });

  testWidgets('filters by this month and last month', (
    WidgetTester tester,
  ) async {
    final now = DateTime.now().toUtc();
    final thisMonthDate = DateTime.utc(now.year, now.month, 10);
    final lastMonthDate = DateTime.utc(now.year, now.month - 1, 10);

    await tester.pumpWidget(
      buildTestApp(
        loadItems: () async => <TripHistoryItem>[
          TripHistoryItem(
            tripId: 'trip_this',
            routeId: 'route_1',
            routeName: 'Bu Ay Rotasi',
            referenceAtUtc: thisMonthDate,
            counterpartLabel: 'Sofor: A',
            status: TripHistoryStatus.completed,
            durationMinutes: 20,
          ),
          TripHistoryItem(
            tripId: 'trip_last',
            routeId: 'route_2',
            routeName: 'Gecen Ay Rotasi',
            referenceAtUtc: lastMonthDate,
            counterpartLabel: 'Sofor: B',
            status: TripHistoryStatus.completed,
            durationMinutes: 25,
          ),
        ],
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Bu Ay Rotasi'), findsOneWidget);
    expect(find.text('Gecen Ay Rotasi'), findsOneWidget);

    await tester.tap(find.text('Bu Ay'));
    await tester.pumpAndSettle();
    expect(find.text('Bu Ay Rotasi'), findsOneWidget);
    expect(find.text('Gecen Ay Rotasi'), findsNothing);

    await tester.tap(find.text('Gecen Ay'));
    await tester.pumpAndSettle();
    expect(find.text('Bu Ay Rotasi'), findsNothing);
    expect(find.text('Gecen Ay Rotasi'), findsOneWidget);
  });
}
