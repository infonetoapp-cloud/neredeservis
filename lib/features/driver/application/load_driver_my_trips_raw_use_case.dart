import '../domain/driver_my_trips_repository.dart';

class LoadDriverMyTripsRawUseCase {
  LoadDriverMyTripsRawUseCase({
    required DriverMyTripsRepository repository,
  }) : _repository = repository;

  final DriverMyTripsRepository _repository;

  Future<DriverMyTripsRawData> execute({
    required String? driverUid,
  }) async {
    final normalizedDriverUid = driverUid?.trim();
    if (normalizedDriverUid == null || normalizedDriverUid.isEmpty) {
      return const DriverMyTripsRawData();
    }

    return _repository.loadRawData(driverUid: normalizedDriverUid);
  }
}
