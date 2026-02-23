class DriverHomeRouteCandidate {
  const DriverHomeRouteCandidate({
    required this.routeId,
    required this.routeName,
    required this.updatedAtUtc,
    required this.isOwnedByCurrentDriver,
  });

  final String routeId;
  final String routeName;
  final DateTime updatedAtUtc;
  final bool isOwnedByCurrentDriver;
}

class DriverHomeStopSummary {
  const DriverHomeStopSummary({
    required this.stopId,
    required this.name,
    required this.order,
    this.passengersWaiting,
  });

  final String stopId;
  final String name;
  final int order;
  final int? passengersWaiting;
}

abstract class DriverHomeRouteSectionRepository {
  Future<List<DriverHomeRouteCandidate>> loadCandidateRoutes(String uid);
  Future<List<DriverHomeStopSummary>> loadRouteStops(String routeId);
}
