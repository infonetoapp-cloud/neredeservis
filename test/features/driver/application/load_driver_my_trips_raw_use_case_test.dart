import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/driver/application/load_driver_my_trips_raw_use_case.dart';
import 'package:neredeservis/features/driver/domain/driver_my_trips_repository.dart';

void main() {
  group('LoadDriverMyTripsRawUseCase', () {
    test('returns empty result for missing uid and skips repository', () async {
      final repository = _FakeDriverMyTripsRepository();
      final useCase = LoadDriverMyTripsRawUseCase(repository: repository);

      final result = await useCase.execute(driverUid: '  ');

      expect(result.managedRouteDocs, isEmpty);
      expect(result.tripRows, isEmpty);
      expect(repository.calls, 0);
    });

    test('delegates to repository with normalized uid', () async {
      const expected = DriverMyTripsRawData(
        managedRouteDocs: <String, Map<String, dynamic>>{
          'route-1': <String, dynamic>{'name': 'Hat A'},
        },
        tripRows: <DriverMyTripsRawTripRow>[
          DriverMyTripsRawTripRow(
            tripId: 'trip-1',
            tripData: <String, dynamic>{'routeId': 'route-1'},
          ),
        ],
      );
      final repository = _FakeDriverMyTripsRepository(data: expected);
      final useCase = LoadDriverMyTripsRawUseCase(repository: repository);

      final result = await useCase.execute(driverUid: ' driver-1 ');

      expect(repository.calls, 1);
      expect(repository.lastDriverUid, 'driver-1');
      expect(result.managedRouteDocs['route-1']?['name'], 'Hat A');
      expect(result.tripRows.length, 1);
      expect(result.tripRows.first.tripId, 'trip-1');
    });

    test('rethrows repository failures', () async {
      final repository = _FakeDriverMyTripsRepository(throwOnLoad: true);
      final useCase = LoadDriverMyTripsRawUseCase(repository: repository);

      expect(
        () => useCase.execute(driverUid: 'driver-1'),
        throwsA(isA<StateError>()),
      );
      expect(repository.calls, 1);
    });
  });
}

class _FakeDriverMyTripsRepository implements DriverMyTripsRepository {
  _FakeDriverMyTripsRepository({
    this.data = const DriverMyTripsRawData(),
    this.throwOnLoad = false,
  });

  final DriverMyTripsRawData data;
  final bool throwOnLoad;
  int calls = 0;
  String? lastDriverUid;

  @override
  Future<DriverMyTripsRawData> loadRawData({required String driverUid}) async {
    calls += 1;
    lastDriverUid = driverUid;
    if (throwOnLoad) {
      throw StateError('boom');
    }
    return data;
  }
}
