import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/driver/application/compose_driver_trip_history_item_seeds_use_case.dart';
import 'package:neredeservis/features/driver/domain/driver_trip_history_repository.dart';

void main() {
  group('ComposeDriverTripHistoryItemSeedsUseCase', () {
    test('composes, sorts, and filters driver trip history seeds', () {
      final useCase = ComposeDriverTripHistoryItemSeedsUseCase(
        nowUtc: () => DateTime.utc(2026, 2, 23, 12),
      );

      final result = useCase.execute(
        const DriverTripHistoryRawData(
          tripRows: <DriverTripHistoryRawTripRow>[
            DriverTripHistoryRawTripRow(
              tripId: 'trip-completed',
              tripData: <String, dynamic>{
                'routeId': 'route-1',
                'status': 'completed',
                'startedAt': '2026-02-23T09:00:00Z',
                'endedAt': '2026-02-23T09:45:00Z',
              },
            ),
            DriverTripHistoryRawTripRow(
              tripId: 'trip-partial',
              tripData: <String, dynamic>{
                'routeId': 'route-2',
                'status': 'canceled',
                'endedAt': '2026-02-23T10:00:00Z',
              },
            ),
            DriverTripHistoryRawTripRow(
              tripId: 'trip-ignore-status',
              tripData: <String, dynamic>{
                'routeId': 'route-2',
                'status': 'active',
              },
            ),
            DriverTripHistoryRawTripRow(
              tripId: 'trip-ignore-route',
              tripData: <String, dynamic>{'status': 'completed'},
            ),
          ],
          routesById: <String, Map<String, dynamic>>{
            'route-1': <String, dynamic>{
              'name': 'Hat A',
              'passengerCount': 8,
            },
            'route-2': <String, dynamic>{'passengerCount': 0},
          },
        ),
      );

      expect(result, hasLength(2));
      expect(result.first.tripId, 'trip-partial');
      expect(result.first.status, DriverTripHistoryItemSeedStatus.partial);
      expect(result.first.routeName, 'Rota');
      expect(result.first.passengerCount, 0);

      expect(result.last.tripId, 'trip-completed');
      expect(result.last.status, DriverTripHistoryItemSeedStatus.completed);
      expect(result.last.routeName, 'Hat A');
      expect(result.last.passengerCount, 8);
      expect(result.last.durationMinutes, 45);
    });

    test('uses fallback nowUtc and clamps invalid duration to null', () {
      final fallbackNow = DateTime.utc(2026, 2, 23, 12, 15);
      final useCase = ComposeDriverTripHistoryItemSeedsUseCase(
        nowUtc: () => fallbackNow,
      );

      final result = useCase.execute(
        const DriverTripHistoryRawData(
          tripRows: <DriverTripHistoryRawTripRow>[
            DriverTripHistoryRawTripRow(
              tripId: 'trip-1',
              tripData: <String, dynamic>{
                'routeId': 'route-1',
                'status': 'abandoned',
                'startedAt': '2026-02-23T11:00:00Z',
                'endedAt': '2026-02-23T10:00:00Z',
              },
            ),
          ],
          routesById: <String, Map<String, dynamic>>{
            'route-1': <String, dynamic>{},
          },
        ),
      );

      expect(result, hasLength(1));
      expect(result.single.referenceAtUtc, DateTime.utc(2026, 2, 23, 10, 0));
      expect(result.single.durationMinutes, isNull);
      expect(result.single.status, DriverTripHistoryItemSeedStatus.partial);
    });

    test('limits output to 120 items', () {
      final useCase = ComposeDriverTripHistoryItemSeedsUseCase(
        nowUtc: () => DateTime.utc(2026, 2, 23, 12),
      );
      final rows = List<DriverTripHistoryRawTripRow>.generate(
        130,
        (index) => DriverTripHistoryRawTripRow(
          tripId: 'trip-$index',
          tripData: <String, dynamic>{
            'routeId': 'route-1',
            'status': 'completed',
            'endedAt': DateTime.utc(2026, 2, 23, 12)
                .subtract(Duration(minutes: index))
                .toIso8601String(),
          },
        ),
      );

      final result = useCase.execute(
        DriverTripHistoryRawData(
          tripRows: rows,
          routesById: const <String, Map<String, dynamic>>{
            'route-1': <String, dynamic>{'name': 'Hat'},
          },
        ),
      );

      expect(result, hasLength(120));
      expect(result.first.tripId, 'trip-0');
      expect(result.last.tripId, 'trip-119');
    });
  });
}
