import '../domain/passenger_trip_history_repository.dart';

class LoadPassengerTripHistoryRawUseCase {
  LoadPassengerTripHistoryRawUseCase({
    required PassengerTripHistoryRepository repository,
  }) : _repository = repository;

  final PassengerTripHistoryRepository _repository;

  Future<PassengerTripHistoryRawData> execute({
    required String? passengerUid,
  }) async {
    final normalizedPassengerUid = passengerUid?.trim();
    if (normalizedPassengerUid == null || normalizedPassengerUid.isEmpty) {
      return const PassengerTripHistoryRawData();
    }

    return _repository.loadRawData(passengerUid: normalizedPassengerUid);
  }
}
