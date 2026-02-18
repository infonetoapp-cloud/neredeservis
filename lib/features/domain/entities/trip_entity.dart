enum TripStatus {
  active,
  completed,
  abandoned,
  unknown,
}

TripStatus tripStatusFromRaw(String? rawStatus) {
  switch (rawStatus) {
    case 'active':
      return TripStatus.active;
    case 'completed':
      return TripStatus.completed;
    case 'abandoned':
      return TripStatus.abandoned;
    default:
      return TripStatus.unknown;
  }
}

enum TripEndReason {
  driverFinished,
  autoAbandoned,
  unknown,
}

TripEndReason? tripEndReasonFromRaw(String? rawEndReason) {
  switch (rawEndReason) {
    case null:
      return null;
    case 'driver_finished':
      return TripEndReason.driverFinished;
    case 'auto_abandoned':
      return TripEndReason.autoAbandoned;
    default:
      return TripEndReason.unknown;
  }
}

class TripDriverSnapshotEntity {
  const TripDriverSnapshotEntity({
    required this.name,
    required this.plate,
    required this.phone,
  });

  final String name;
  final String plate;
  final String? phone;
}

class TripEntity {
  const TripEntity({
    required this.tripId,
    required this.routeId,
    required this.driverId,
    required this.driverSnapshot,
    required this.status,
    required this.startedAt,
    required this.endedAt,
    required this.lastLocationAt,
    required this.endReason,
    required this.startedByDeviceId,
    required this.transitionVersion,
    required this.updatedAt,
  });

  final String tripId;
  final String routeId;
  final String driverId;
  final TripDriverSnapshotEntity driverSnapshot;
  final TripStatus status;
  final DateTime startedAt;
  final DateTime? endedAt;
  final DateTime lastLocationAt;
  final TripEndReason? endReason;
  final String startedByDeviceId;
  final int transitionVersion;
  final DateTime updatedAt;
}
