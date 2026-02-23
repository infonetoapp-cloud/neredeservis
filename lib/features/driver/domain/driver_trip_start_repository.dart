class DriverTripStartCommand {
  const DriverTripStartCommand({
    required this.routeId,
    required this.deviceId,
    required this.idempotencyKey,
    required this.expectedTransitionVersion,
  });

  final String routeId;
  final String deviceId;
  final String idempotencyKey;
  final int expectedTransitionVersion;
}

class DriverTripStartResult {
  const DriverTripStartResult({
    required this.tripId,
    required this.status,
  });

  final String tripId;
  final String status;
}

abstract class DriverTripStartRepository {
  Future<DriverTripStartResult> startTrip(DriverTripStartCommand command);
}
