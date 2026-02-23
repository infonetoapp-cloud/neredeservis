import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/driver/application/compose_driver_my_trips_card_seeds_use_case.dart';
import 'package:neredeservis/features/driver/domain/driver_my_trips_repository.dart';

void main() {
  group('ComposeDriverMyTripsCardSeedsUseCase', () {
    test('builds planned/live seeds from managed routes and active buckets',
        () {
      final useCase = ComposeDriverMyTripsCardSeedsUseCase(
        nowLocal: () => DateTime(2026, 2, 23, 10, 0),
      );

      final result = useCase.execute(
        managedRouteDocs: <String, Map<String, dynamic>>{
          'route-1': <String, dynamic>{
            'name': 'Hat A',
            'scheduledTime': '08:30',
            'startAddress': 'Baslangic',
            'endAddress': 'Bitis',
            'passengerCount': 5,
            'startPoint': <String, dynamic>{'lat': 41.0, 'lng': 29.0},
            'endPoint': <String, dynamic>{'lat': 41.1, 'lng': 29.1},
          },
          'route-2': <String, dynamic>{
            'name': 'Hat B',
            'updatedAt': '2026-02-23T09:00:00Z',
          },
        },
        activeTripByRoute: <String, DriverMyTripsRawTripRow>{
          'route-1': const DriverMyTripsRawTripRow(
            tripId: 'trip-1',
            tripData: <String, dynamic>{
              'status': 'active',
              'startedAt': '2026-02-23T07:45:00Z',
            },
          ),
        },
        historyTripRows: const <DriverMyTripsRawTripRow>[],
      );

      expect(result, hasLength(2));
      final live = result.firstWhere((seed) => seed.routeId == 'route-1');
      final planned = result.firstWhere((seed) => seed.routeId == 'route-2');
      expect(live.status, DriverMyTripsCardSeedStatus.live);
      expect(live.tripId, 'trip-1');
      expect(live.passengerCount, 5);
      expect(live.startPoint, isNotNull);
      expect(planned.status, DriverMyTripsCardSeedStatus.planned);
      expect(planned.sortAtUtc, DateTime.utc(2026, 2, 23, 9, 0));
    });

    test('builds history seeds and skips unsupported/missing-route entries',
        () {
      final useCase = ComposeDriverMyTripsCardSeedsUseCase(
        nowLocal: () => DateTime(2026, 2, 23, 10, 0),
      );

      final result = useCase.execute(
        managedRouteDocs: <String, Map<String, dynamic>>{
          'route-1': <String, dynamic>{'name': 'Hat A'},
        },
        activeTripByRoute: const <String, DriverMyTripsRawTripRow>{},
        historyTripRows: <DriverMyTripsRawTripRow>[
          const DriverMyTripsRawTripRow(
            tripId: 'trip-completed',
            tripData: <String, dynamic>{
              'routeId': 'route-1',
              'status': 'completed',
              'endedAt': '2026-02-23T08:00:00Z',
            },
          ),
          const DriverMyTripsRawTripRow(
            tripId: 'trip-canceled',
            tripData: <String, dynamic>{
              'routeId': 'route-9',
              'status': 'canceled',
              'routeName': 'Fallback',
            },
          ),
          const DriverMyTripsRawTripRow(
            tripId: 'trip-ignore',
            tripData: <String, dynamic>{
              'routeId': 'route-1',
              'status': 'active',
            },
          ),
          const DriverMyTripsRawTripRow(
            tripId: 'trip-missing-route',
            tripData: <String, dynamic>{'status': 'completed'},
          ),
        ],
      );

      expect(result.where((seed) => seed.isHistory), hasLength(2));
      final completed =
          result.firstWhere((seed) => seed.tripId == 'trip-completed');
      final canceled =
          result.firstWhere((seed) => seed.tripId == 'trip-canceled');
      expect(completed.status, DriverMyTripsCardSeedStatus.completed);
      expect(completed.routeName, 'Hat A');
      expect(canceled.status, DriverMyTripsCardSeedStatus.canceled);
      expect(canceled.routeName, 'Fallback');
    });
  });
}
