import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/passenger/application/compose_passenger_trip_history_item_seeds_use_case.dart';
import 'package:neredeservis/features/passenger/domain/passenger_trip_history_repository.dart';

void main() {
  group('ComposePassengerTripHistoryItemSeedsUseCase', () {
    test('composes passenger seeds from route, driver and snapshot data', () {
      final useCase = ComposePassengerTripHistoryItemSeedsUseCase(
        nowUtc: () => DateTime.utc(2026, 2, 23, 12),
      );

      final result = useCase.execute(
        const PassengerTripHistoryRawData(
          tripRows: <PassengerTripHistoryRawTripRow>[
            PassengerTripHistoryRawTripRow(
              tripId: 'trip-snapshot',
              tripData: <String, dynamic>{
                'routeId': 'route-1',
                'status': 'completed',
                'driverId': 'driver-1',
                'driverSnapshot': <String, dynamic>{'name': 'Snapshot Driver'},
                'endedAt': '2026-02-23T11:00:00Z',
              },
            ),
            PassengerTripHistoryRawTripRow(
              tripId: 'trip-driver-doc',
              tripData: <String, dynamic>{
                'routeId': 'route-2',
                'status': 'canceled',
                'endedAt': '2026-02-23T10:00:00Z',
              },
            ),
            PassengerTripHistoryRawTripRow(
              tripId: 'trip-ignore',
              tripData: <String, dynamic>{
                'routeId': 'route-2',
                'status': 'active',
              },
            ),
          ],
          candidateRoutesById: <String, Map<String, dynamic>>{
            'route-1': <String, dynamic>{
              'name': 'Hat A',
              'driverId': 'driver-1'
            },
            'route-2': <String, dynamic>{'driverId': 'driver-2'},
          },
          driversById: <String, Map<String, dynamic>>{
            'driver-1': <String, dynamic>{
              'name': 'Driver Doc',
              'photoUrl': 'https://example.com/1.jpg',
            },
            'driver-2': <String, dynamic>{
              'name': 'Doc Driver',
              'photoUrl': 'https://example.com/2.jpg',
            },
          },
        ),
      );

      expect(result, hasLength(2));
      expect(result.first.tripId, 'trip-snapshot');
      expect(result.first.status, PassengerTripHistoryItemSeedStatus.completed);
      expect(result.first.routeName, 'Hat A');
      expect(result.first.driverName, 'Snapshot Driver');
      expect(result.first.driverPhotoUrl, 'https://example.com/1.jpg');

      expect(result.last.tripId, 'trip-driver-doc');
      expect(result.last.status, PassengerTripHistoryItemSeedStatus.partial);
      expect(result.last.routeName, 'Rota');
      expect(result.last.driverName, 'Doc Driver');
      expect(result.last.driverPhotoUrl, 'https://example.com/2.jpg');
    });

    test('uses fallback nowUtc and limits output to 120 items', () {
      final fallbackNow = DateTime.utc(2026, 2, 23, 12, 30);
      final useCase = ComposePassengerTripHistoryItemSeedsUseCase(
        nowUtc: () => fallbackNow,
      );

      final rows = List<PassengerTripHistoryRawTripRow>.generate(
        125,
        (index) => PassengerTripHistoryRawTripRow(
          tripId: 'trip-$index',
          tripData: <String, dynamic>{
            'routeId': 'route-1',
            'status': 'completed',
            if (index > 0)
              'endedAt': DateTime.utc(2026, 2, 23, 12)
                  .subtract(Duration(minutes: index))
                  .toIso8601String(),
          },
        ),
      );

      final result = useCase.execute(
        PassengerTripHistoryRawData(
          tripRows: rows,
          candidateRoutesById: const <String, Map<String, dynamic>>{
            'route-1': <String, dynamic>{'name': 'Hat'},
          },
        ),
      );

      expect(result, hasLength(120));
      expect(result.first.referenceAtUtc, fallbackNow);
      expect(result.first.tripId, 'trip-0');
      expect(result.last.tripId, 'trip-119');
    });
  });
}
