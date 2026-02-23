import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/driver/application/load_driver_trip_history_raw_use_case.dart';
import 'package:neredeservis/features/driver/domain/driver_trip_history_repository.dart';

void main() {
  group('LoadDriverTripHistoryRawUseCase', () {
    test('returns empty result for missing uid and skips repository', () async {
      final repository = _FakeDriverTripHistoryRepository();
      final useCase = LoadDriverTripHistoryRawUseCase(repository: repository);

      final result = await useCase.execute(driverUid: '  ');

      expect(result.tripRows, isEmpty);
      expect(result.routesById, isEmpty);
      expect(repository.calls, 0);
    });

    test('delegates to repository with normalized uid', () async {
      const expected = DriverTripHistoryRawData(
        tripRows: <DriverTripHistoryRawTripRow>[
          DriverTripHistoryRawTripRow(
            tripId: 'trip-1',
            tripData: <String, dynamic>{'routeId': 'route-1'},
          ),
        ],
        routesById: <String, Map<String, dynamic>>{
          'route-1': <String, dynamic>{'name': 'Hat A'},
        },
      );
      final repository = _FakeDriverTripHistoryRepository(data: expected);
      final useCase = LoadDriverTripHistoryRawUseCase(repository: repository);

      final result = await useCase.execute(driverUid: ' driver-1 ');

      expect(repository.calls, 1);
      expect(repository.lastDriverUid, 'driver-1');
      expect(result.tripRows.length, 1);
      expect(result.tripRows.first.tripId, 'trip-1');
      expect(result.routesById['route-1']?['name'], 'Hat A');
    });

    test('rethrows repository failures', () async {
      final repository = _FakeDriverTripHistoryRepository(throwOnLoad: true);
      final useCase = LoadDriverTripHistoryRawUseCase(repository: repository);

      expect(
        () => useCase.execute(driverUid: 'driver-1'),
        throwsA(isA<StateError>()),
      );
      expect(repository.calls, 1);
    });
  });
}

class _FakeDriverTripHistoryRepository implements DriverTripHistoryRepository {
  _FakeDriverTripHistoryRepository({
    this.data = const DriverTripHistoryRawData(),
    this.throwOnLoad = false,
  });

  final DriverTripHistoryRawData data;
  final bool throwOnLoad;
  int calls = 0;
  String? lastDriverUid;

  @override
  Future<DriverTripHistoryRawData> loadRawData(
      {required String driverUid}) async {
    calls += 1;
    lastDriverUid = driverUid;
    if (throwOnLoad) {
      throw StateError('boom');
    }
    return data;
  }
}
