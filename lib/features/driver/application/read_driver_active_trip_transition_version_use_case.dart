import '../domain/driver_active_trip_transition_version_repository.dart';

class ReadDriverActiveTripTransitionVersionUseCase {
  ReadDriverActiveTripTransitionVersionUseCase({
    required DriverActiveTripTransitionVersionRepository repository,
  }) : _repository = repository;

  final DriverActiveTripTransitionVersionRepository _repository;

  Future<int> execute(String routeId) {
    return _repository.readCurrentTransitionVersion(routeId);
  }
}
