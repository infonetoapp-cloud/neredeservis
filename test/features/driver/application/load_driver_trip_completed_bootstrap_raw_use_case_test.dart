import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/driver/application/load_driver_trip_completed_bootstrap_raw_use_case.dart';
import 'package:neredeservis/features/driver/domain/driver_trip_completed_bootstrap_repository.dart';

void main() {
  group('LoadDriverTripCompletedBootstrapRawUseCase', () {
    test('returns null for missing route/trip ids and skips repository',
        () async {
      final repository = _FakeDriverTripCompletedBootstrapRepository();
      final useCase = LoadDriverTripCompletedBootstrapRawUseCase(
        repository: repository,
      );

      final result = await useCase.execute(routeId: '  ', tripId: null);

      expect(result, isNull);
      expect(repository.calls, 0);
    });

    test('delegates to repository for normalized ids', () async {
      const expected = DriverTripCompletedBootstrapRawData(
        routeData: <String, dynamic>{'passengerCount': 5},
        stops: <Map<String, dynamic>>[
          <String, dynamic>{'name': 'A', 'order': 1},
        ],
        passengerCountFromRoutePassengersCollection: 3,
        tripData: <String, dynamic>{'startedAt': '2026-02-23T10:00:00Z'},
      );
      final repository = _FakeDriverTripCompletedBootstrapRepository(
        data: expected,
      );
      final useCase = LoadDriverTripCompletedBootstrapRawUseCase(
        repository: repository,
      );

      final result = await useCase.execute(
        routeId: ' route-1 ',
        tripId: ' trip-1 ',
      );

      expect(result, isNotNull);
      expect(result!.routeData?['passengerCount'], 5);
      expect(result.stops.length, 1);
      expect(repository.calls, 1);
      expect(repository.lastRouteId, 'route-1');
      expect(repository.lastTripId, 'trip-1');
    });

    test('returns null when repository throws', () async {
      final repository = _FakeDriverTripCompletedBootstrapRepository(
        throwOnLoad: true,
      );
      final useCase = LoadDriverTripCompletedBootstrapRawUseCase(
        repository: repository,
      );

      final result =
          await useCase.execute(routeId: 'route-1', tripId: 'trip-1');

      expect(result, isNull);
      expect(repository.calls, 1);
    });
  });
}

class _FakeDriverTripCompletedBootstrapRepository
    implements DriverTripCompletedBootstrapRepository {
  _FakeDriverTripCompletedBootstrapRepository({
    this.data = const DriverTripCompletedBootstrapRawData(),
    this.throwOnLoad = false,
  });

  final DriverTripCompletedBootstrapRawData data;
  final bool throwOnLoad;
  int calls = 0;
  String? lastRouteId;
  String? lastTripId;

  @override
  Future<DriverTripCompletedBootstrapRawData> loadRawData({
    required String routeId,
    required String tripId,
  }) async {
    calls++;
    lastRouteId = routeId;
    lastTripId = tripId;
    if (throwOnLoad) {
      throw Exception('load');
    }
    return data;
  }
}
