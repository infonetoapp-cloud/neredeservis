class DriverTripDetailRawStopRow {
  const DriverTripDetailRawStopRow({
    required this.stopId,
    required this.stopData,
  });

  final String stopId;
  final Map<String, dynamic> stopData;
}

class DriverTripDetailRawPassengerRow {
  const DriverTripDetailRawPassengerRow({
    required this.passengerId,
    required this.passengerData,
  });

  final String passengerId;
  final Map<String, dynamic> passengerData;
}

class DriverTripDetailBootstrapRawData {
  const DriverTripDetailBootstrapRawData({
    this.routeData,
    this.stopRows = const <DriverTripDetailRawStopRow>[],
    this.passengerRows = const <DriverTripDetailRawPassengerRow>[],
    this.tripData,
  });

  final Map<String, dynamic>? routeData;
  final List<DriverTripDetailRawStopRow> stopRows;
  final List<DriverTripDetailRawPassengerRow> passengerRows;
  final Map<String, dynamic>? tripData;
}

abstract class DriverTripDetailBootstrapRepository {
  Future<DriverTripDetailBootstrapRawData> loadRawData({
    required String routeId,
    required String? tripId,
  });
}
