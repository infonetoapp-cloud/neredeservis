abstract class RouteRepository {
  Stream<RouteMembership?> watchMembership(String userId);
  Future<RouteMembership> joinBySrvCode(String srvCode);
  Future<void> leaveRoute(String routeId);
}

abstract class TripRepository {
  Stream<TripSnapshot?> watchActiveTrip(String routeId);
  Future<void> startTrip(StartTripCommand command);
  Future<void> finishTrip(FinishTripCommand command);
}

abstract class AnnouncementRepository {
  Future<void> sendDriverAnnouncement(DriverAnnouncementCommand command);
}

class RouteMembership {
  const RouteMembership({
    required this.routeId,
    required this.routeName,
    required this.role,
  });

  final String routeId;
  final String routeName;
  final String role;
}

class TripSnapshot {
  const TripSnapshot({
    required this.tripId,
    required this.routeId,
    required this.status,
    required this.lastLocationEpochMs,
  });

  final String tripId;
  final String routeId;
  final String status;
  final int lastLocationEpochMs;
}

class StartTripCommand {
  const StartTripCommand({
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

class FinishTripCommand {
  const FinishTripCommand({
    required this.tripId,
    required this.deviceId,
    required this.idempotencyKey,
    required this.expectedTransitionVersion,
  });

  final String tripId;
  final String deviceId;
  final String idempotencyKey;
  final int expectedTransitionVersion;
}

class DriverAnnouncementCommand {
  const DriverAnnouncementCommand({
    required this.routeId,
    required this.tripId,
    required this.message,
  });

  final String routeId;
  final String tripId;
  final String message;
}
