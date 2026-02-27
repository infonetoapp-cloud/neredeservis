class DriverActiveTripContextLookupCommand {
  const DriverActiveTripContextLookupCommand({
    required this.uid,
    this.tripId,
    this.routeId,
    this.initialTransitionVersion,
  });

  final String uid;
  final String? tripId;
  final String? routeId;
  final int? initialTransitionVersion;
}

class DriverActiveTripContextLookupResult {
  const DriverActiveTripContextLookupResult({
    required this.routeId,
    required this.tripId,
    required this.transitionVersion,
  });

  final String routeId;
  final String tripId;
  final int transitionVersion;
}

abstract class DriverActiveTripContextLookupRepository {
  Future<DriverActiveTripContextLookupResult?> resolveActiveTripContext(
    DriverActiveTripContextLookupCommand command,
  );
}
