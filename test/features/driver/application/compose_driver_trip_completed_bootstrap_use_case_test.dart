import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/driver/application/compose_driver_trip_completed_bootstrap_use_case.dart';
import 'package:neredeservis/features/driver/domain/driver_trip_completed_bootstrap_repository.dart';

void main() {
  group('ComposeDriverTripCompletedBootstrapUseCase', () {
    test('composes totals and sorted stop timeline from raw data', () {
      final useCase = ComposeDriverTripCompletedBootstrapUseCase(
        nowUtc: () => DateTime.utc(2026, 2, 23, 12),
      );

      final result = useCase.execute(
        const DriverTripCompletedBootstrapRawData(
          routeData: <String, dynamic>{'passengerCount': 12},
          passengerCountFromRoutePassengersCollection: 3,
          tripData: <String, dynamic>{
            'startedAt': '2026-02-23T10:00:00Z',
            'endedAt': '2026-02-23T10:45:00Z',
          },
          stops: <Map<String, dynamic>>[
            <String, dynamic>{
              'name': 'B',
              'order': 2,
              'passengersWaiting': 4,
              'location': <String, dynamic>{'lat': 41.001, 'lng': 29.001},
            },
            <String, dynamic>{
              'name': 'A',
              'order': 1,
              'passengersWaiting': 2,
              'location': <String, dynamic>{'lat': 41.0, 'lng': 29.0},
            },
          ],
        ),
      );

      expect(result.totalPassengers, 12);
      expect(result.totalDurationMinutes, 45);
      expect(result.startedAtUtc, DateTime.utc(2026, 2, 23, 10));
      expect(result.stops.length, 2);
      expect(result.stops.first.name, 'A');
      expect(result.stops.first.passengerCount, 2);
      expect(result.stops.last.name, 'B');
      expect(result.totalDistanceKm, greaterThan(0));
    });

    test('uses fallbacks for missing timestamps and negative passenger count',
        () {
      final now = DateTime.utc(2026, 2, 23, 12, 30);
      final useCase = ComposeDriverTripCompletedBootstrapUseCase(
        nowUtc: () => now,
      );

      final result = useCase.execute(
        const DriverTripCompletedBootstrapRawData(
          routeData: <String, dynamic>{'passengerCount': -1},
          passengerCountFromRoutePassengersCollection: -5,
          tripData: <String, dynamic>{},
          stops: <Map<String, dynamic>>[
            <String, dynamic>{
              'order': 1,
              'location': <String, dynamic>{'lat': 'bad', 'lng': 29},
            },
          ],
        ),
      );

      expect(
        result.startedAtUtc,
        now.subtract(const Duration(minutes: 30)),
      );
      expect(result.totalDurationMinutes, 0);
      expect(result.totalPassengers, 0);
      expect(result.totalDistanceKm, 0);
      expect(result.stops.single.name, 'Durak');
    });

    test('clamps negative duration to zero', () {
      final useCase = ComposeDriverTripCompletedBootstrapUseCase(
        nowUtc: () => DateTime.utc(2026, 2, 23, 12),
      );

      final result = useCase.execute(
        const DriverTripCompletedBootstrapRawData(
          tripData: <String, dynamic>{
            'startedAt': '2026-02-23T11:00:00Z',
            'endedAt': '2026-02-23T10:00:00Z',
          },
        ),
      );

      expect(result.totalDurationMinutes, 0);
    });
  });
}
