class DriverTripHistoryRawTripRow {
  const DriverTripHistoryRawTripRow({
    required this.tripId,
    required this.tripData,
  });

  final String tripId;
  final Map<String, dynamic> tripData;
}

class DriverTripHistoryRawData {
  const DriverTripHistoryRawData({
    this.tripRows = const <DriverTripHistoryRawTripRow>[],
    this.routesById = const <String, Map<String, dynamic>>{},
  });

  final List<DriverTripHistoryRawTripRow> tripRows;
  final Map<String, Map<String, dynamic>> routesById;
}

abstract class DriverTripHistoryRepository {
  Future<DriverTripHistoryRawData> loadRawData({
    required String driverUid,
  });
}
