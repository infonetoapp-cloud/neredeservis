class DriverMyTripsRawTripRow {
  const DriverMyTripsRawTripRow({
    required this.tripId,
    required this.tripData,
  });

  final String tripId;
  final Map<String, dynamic> tripData;
}

class DriverMyTripsRawData {
  const DriverMyTripsRawData({
    this.managedRouteDocs = const <String, Map<String, dynamic>>{},
    this.tripRows = const <DriverMyTripsRawTripRow>[],
  });

  final Map<String, Map<String, dynamic>> managedRouteDocs;
  final List<DriverMyTripsRawTripRow> tripRows;
}

abstract class DriverMyTripsRepository {
  Future<DriverMyTripsRawData> loadRawData({
    required String driverUid,
  });
}
