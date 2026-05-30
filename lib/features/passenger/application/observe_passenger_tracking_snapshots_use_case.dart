import '../domain/passenger_tracking_snapshot_repository.dart';

class ObservePassengerTrackingSnapshotsUseCase {
  ObservePassengerTrackingSnapshotsUseCase({
    required PassengerTrackingSnapshotRepository repository,
  }) : _repository = repository;

  final PassengerTrackingSnapshotRepository _repository;

  Stream<PassengerTrackingSnapshotData?> watchPassengerRouteTracking(
    String routeId,
  ) {
    return _repository.watchPassengerRouteTracking(routeId);
  }

  Stream<PassengerTrackingSnapshotData?> watchGuestSessionTracking(
    String sessionId,
  ) {
    return _repository.watchGuestSessionTracking(sessionId);
  }
}
