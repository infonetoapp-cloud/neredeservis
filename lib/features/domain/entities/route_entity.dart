enum RouteVisibility {
  privateOnly,
}

RouteVisibility routeVisibilityFromRaw(String? rawVisibility) {
  switch (rawVisibility) {
    case 'private':
    default:
      return RouteVisibility.privateOnly;
  }
}

enum RouteCreationMode {
  manualPin,
  ghostDrive,
  unknown,
}

RouteCreationMode routeCreationModeFromRaw(String? rawCreationMode) {
  switch (rawCreationMode) {
    case 'manual_pin':
      return RouteCreationMode.manualPin;
    case 'ghost_drive':
      return RouteCreationMode.ghostDrive;
    default:
      return RouteCreationMode.unknown;
  }
}

enum RouteTimeSlot {
  morning,
  evening,
  midday,
  custom,
  unknown,
}

RouteTimeSlot routeTimeSlotFromRaw(String? rawTimeSlot) {
  switch (rawTimeSlot) {
    case 'morning':
      return RouteTimeSlot.morning;
    case 'evening':
      return RouteTimeSlot.evening;
    case 'midday':
      return RouteTimeSlot.midday;
    case 'custom':
      return RouteTimeSlot.custom;
    default:
      return RouteTimeSlot.unknown;
  }
}

class RouteGeoPointEntity {
  const RouteGeoPointEntity({
    required this.lat,
    required this.lng,
  });

  final double lat;
  final double lng;
}

class RouteEntity {
  const RouteEntity({
    required this.routeId,
    required this.name,
    required this.driverId,
    required this.authorizedDriverIds,
    required this.memberIds,
    required this.companyId,
    required this.srvCode,
    required this.visibility,
    required this.allowGuestTracking,
    required this.creationMode,
    required this.routePolyline,
    required this.startPoint,
    required this.startAddress,
    required this.endPoint,
    required this.endAddress,
    required this.scheduledTime,
    required this.timeSlot,
    required this.isArchived,
    required this.vacationUntil,
    required this.passengerCount,
    required this.lastTripStartedNotificationAt,
    required this.createdAt,
    required this.updatedAt,
  });

  final String routeId;
  final String name;
  final String driverId;
  final List<String> authorizedDriverIds;
  final List<String> memberIds;
  final String? companyId;
  final String srvCode;
  final RouteVisibility visibility;
  final bool allowGuestTracking;
  final RouteCreationMode creationMode;
  final String? routePolyline;
  final RouteGeoPointEntity startPoint;
  final String startAddress;
  final RouteGeoPointEntity endPoint;
  final String endAddress;
  final String scheduledTime;
  final RouteTimeSlot timeSlot;
  final bool isArchived;
  final DateTime? vacationUntil;
  final int passengerCount;
  final DateTime? lastTripStartedNotificationAt;
  final DateTime createdAt;
  final DateTime updatedAt;
}
