import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/passenger/application/load_passenger_trip_history_raw_use_case.dart';
import 'package:neredeservis/features/passenger/domain/passenger_trip_history_repository.dart';

void main() {
  group('LoadPassengerTripHistoryRawUseCase', () {
    test('returns empty result for missing uid and skips repository', () async {
      final repository = _FakePassengerTripHistoryRepository();
      final useCase =
          LoadPassengerTripHistoryRawUseCase(repository: repository);

      final result = await useCase.execute(passengerUid: '  ');

      expect(result.tripRows, isEmpty);
      expect(result.candidateRoutesById, isEmpty);
      expect(result.driversById, isEmpty);
      expect(repository.calls, 0);
    });

    test('delegates to repository with normalized uid', () async {
      const expected = PassengerTripHistoryRawData(
        tripRows: <PassengerTripHistoryRawTripRow>[
          PassengerTripHistoryRawTripRow(
            tripId: 'trip-1',
            tripData: <String, dynamic>{'routeId': 'route-1'},
          ),
        ],
        candidateRoutesById: <String, Map<String, dynamic>>{
          'route-1': <String, dynamic>{'name': 'Hat A'},
        },
        driversById: <String, Map<String, dynamic>>{
          'driver-1': <String, dynamic>{'name': 'Ali'},
        },
      );
      final repository = _FakePassengerTripHistoryRepository(data: expected);
      final useCase =
          LoadPassengerTripHistoryRawUseCase(repository: repository);

      final result = await useCase.execute(passengerUid: ' passenger-1 ');

      expect(repository.calls, 1);
      expect(repository.lastPassengerUid, 'passenger-1');
      expect(result.tripRows.length, 1);
      expect(result.candidateRoutesById['route-1']?['name'], 'Hat A');
      expect(result.driversById['driver-1']?['name'], 'Ali');
    });

    test('rethrows repository failures', () async {
      final repository = _FakePassengerTripHistoryRepository(throwOnLoad: true);
      final useCase =
          LoadPassengerTripHistoryRawUseCase(repository: repository);

      expect(
        () => useCase.execute(passengerUid: 'passenger-1'),
        throwsA(isA<StateError>()),
      );
      expect(repository.calls, 1);
    });
  });
}

class _FakePassengerTripHistoryRepository
    implements PassengerTripHistoryRepository {
  _FakePassengerTripHistoryRepository({
    this.data = const PassengerTripHistoryRawData(),
    this.throwOnLoad = false,
  });

  final PassengerTripHistoryRawData data;
  final bool throwOnLoad;
  int calls = 0;
  String? lastPassengerUid;

  @override
  Future<PassengerTripHistoryRawData> loadRawData({
    required String passengerUid,
  }) async {
    calls += 1;
    lastPassengerUid = passengerUid;
    if (throwOnLoad) {
      throw StateError('boom');
    }
    return data;
  }
}
