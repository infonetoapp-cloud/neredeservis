import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/driver/application/classify_driver_my_trips_raw_use_case.dart';
import 'package:neredeservis/features/driver/domain/driver_my_trips_repository.dart';

void main() {
  group('ClassifyDriverMyTripsRawUseCase', () {
    test('returns empty buckets for empty input', () {
      final useCase = ClassifyDriverMyTripsRawUseCase();

      final result = useCase.execute(const <DriverMyTripsRawTripRow>[]);

      expect(result.activeTripByRoute, isEmpty);
      expect(result.historyTripRows, isEmpty);
    });

    test('keeps latest active trip per route and collects history rows', () {
      final useCase = ClassifyDriverMyTripsRawUseCase(
        nowUtc: () => DateTime.utc(2026, 2, 23, 12),
        resolveReferenceAtUtc: (tripData) {
          final value = tripData['ref'];
          return value is DateTime ? value.toUtc() : null;
        },
      );
      final rows = <DriverMyTripsRawTripRow>[
        DriverMyTripsRawTripRow(
          tripId: 'live-old',
          tripData: <String, dynamic>{
            'routeId': 'route-1',
            'status': 'active',
            'ref': DateTime.utc(2026, 2, 23, 8),
          },
        ),
        DriverMyTripsRawTripRow(
          tripId: 'live-new',
          tripData: <String, dynamic>{
            'routeId': 'route-1',
            'status': 'active',
            'ref': DateTime.utc(2026, 2, 23, 9),
          },
        ),
        const DriverMyTripsRawTripRow(
          tripId: 'history-1',
          tripData: <String, dynamic>{
            'routeId': 'route-2',
            'status': 'completed'
          },
        ),
        const DriverMyTripsRawTripRow(
          tripId: 'ignored-1',
          tripData: <String, dynamic>{'routeId': 'route-3', 'status': 'draft'},
        ),
      ];

      final result = useCase.execute(rows);

      expect(result.activeTripByRoute, hasLength(1));
      expect(result.activeTripByRoute['route-1']?.tripId, 'live-new');
      expect(result.historyTripRows.map((row) => row.tripId),
          <String>['history-1']);
    });

    test('skips rows with missing route id and supports canceled aliases', () {
      final useCase = ClassifyDriverMyTripsRawUseCase(
        nowUtc: () => DateTime.utc(2026, 2, 23, 12),
      );
      final rows = <DriverMyTripsRawTripRow>[
        const DriverMyTripsRawTripRow(
          tripId: 'missing-route',
          tripData: <String, dynamic>{'status': 'completed'},
        ),
        const DriverMyTripsRawTripRow(
          tripId: 'canceled-1',
          tripData: <String, dynamic>{
            'routeId': 'route-1',
            'status': 'cancelled',
          },
        ),
        const DriverMyTripsRawTripRow(
          tripId: 'canceled-2',
          tripData: <String, dynamic>{
            'routeId': 'route-2',
            'status': 'canceled',
          },
        ),
      ];

      final result = useCase.execute(rows);

      expect(result.activeTripByRoute, isEmpty);
      expect(result.historyTripRows.map((row) => row.tripId), <String>[
        'canceled-1',
        'canceled-2',
      ]);
    });
  });
}
