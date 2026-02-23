import '../domain/driver_trip_start_repository.dart';

class StartDriverTripUseCase {
  StartDriverTripUseCase({
    required DriverTripStartRepository repository,
  }) : _repository = repository;

  final DriverTripStartRepository _repository;

  Future<DriverTripStartResult> execute(DriverTripStartCommand command) {
    return _repository.startTrip(command);
  }
}
