class DriverTripCompletedBootstrapRawData {
  const DriverTripCompletedBootstrapRawData({
    this.routeData,
    this.stops = const <Map<String, dynamic>>[],
    this.passengerCountFromRoutePassengersCollection = 0,
    this.tripData,
  });

  final Map<String, dynamic>? routeData;
  final List<Map<String, dynamic>> stops;
  final int passengerCountFromRoutePassengersCollection;
  final Map<String, dynamic>? tripData;
}

abstract class DriverTripCompletedBootstrapRepository {
  Future<DriverTripCompletedBootstrapRawData> loadRawData({
    required String routeId,
    required String tripId,
  });
}
