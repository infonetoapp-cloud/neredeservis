import '../domain/driver_finish_trip_stream_repository.dart';

class ObserveDriverFinishTripStreamsUseCase {
  ObserveDriverFinishTripStreamsUseCase({
    required DriverFinishTripStreamRepository repository,
  }) : _repository = repository;

  final DriverFinishTripStreamRepository _repository;

  Stream<DriverFinishTripSnapshotData?> watchSnapshot({
    required String routeId,
    required String dateKey,
    String? tripId,
  }) {
    return _repository.watchSnapshot(
      routeId: routeId,
      dateKey: dateKey,
      tripId: tripId,
    );
  }

  Future<DriverFinishTripSnapshotData?> readSnapshot({
    required String routeId,
    required String dateKey,
    String? tripId,
  }) {
    return _repository.readSnapshot(
      routeId: routeId,
      dateKey: dateKey,
      tripId: tripId,
    );
  }
}
