class PassengerTripHistoryRawTripRow {
  const PassengerTripHistoryRawTripRow({
    required this.tripId,
    required this.tripData,
  });

  final String tripId;
  final Map<String, dynamic> tripData;
}

class PassengerTripHistoryRawData {
  const PassengerTripHistoryRawData({
    this.tripRows = const <PassengerTripHistoryRawTripRow>[],
    this.candidateRoutesById = const <String, Map<String, dynamic>>{},
    this.driversById = const <String, Map<String, dynamic>>{},
  });

  final List<PassengerTripHistoryRawTripRow> tripRows;
  final Map<String, Map<String, dynamic>> candidateRoutesById;
  final Map<String, Map<String, dynamic>> driversById;
}

abstract class PassengerTripHistoryRepository {
  Future<PassengerTripHistoryRawData> loadRawData({
    required String passengerUid,
  });
}
