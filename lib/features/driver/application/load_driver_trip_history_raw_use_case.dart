import '../domain/driver_trip_history_repository.dart';

class LoadDriverTripHistoryRawUseCase {
  LoadDriverTripHistoryRawUseCase({
    required DriverTripHistoryRepository repository,
  }) : _repository = repository;

  final DriverTripHistoryRepository _repository;

  Future<DriverTripHistoryRawData> execute({
    required String? driverUid,
  }) async {
    final normalizedDriverUid = driverUid?.trim();
    if (normalizedDriverUid == null || normalizedDriverUid.isEmpty) {
      return const DriverTripHistoryRawData();
    }

    return _repository.loadRawData(driverUid: normalizedDriverUid);
  }
}
