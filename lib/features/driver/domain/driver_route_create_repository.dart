class DriverRouteCreateCommand {
  const DriverRouteCreateCommand({
    required this.name,
    required this.startLat,
    required this.startLng,
    required this.startAddress,
    required this.endLat,
    required this.endLng,
    required this.endAddress,
    required this.scheduledTime,
    required this.timeSlot,
    required this.allowGuestTracking,
  });

  final String name;
  final double startLat;
  final double startLng;
  final String startAddress;
  final double endLat;
  final double endLng;
  final String endAddress;
  final String scheduledTime;
  final String timeSlot;
  final bool allowGuestTracking;
}

class DriverRouteCreateResult {
  const DriverRouteCreateResult({
    this.routeId,
    this.srvCode = '-',
  });

  final String? routeId;
  final String srvCode;
}

abstract class DriverRouteCreateRepository {
  Future<DriverRouteCreateResult> createRoute(DriverRouteCreateCommand command);
}
