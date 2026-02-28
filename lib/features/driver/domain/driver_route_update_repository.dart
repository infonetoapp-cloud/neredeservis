class DriverRouteUpdatePoint {
  const DriverRouteUpdatePoint({
    required this.lat,
    required this.lng,
  });

  final double lat;
  final double lng;
}

class DriverRouteInlineStopUpsertCommand {
  const DriverRouteInlineStopUpsertCommand({
    required this.stopId,
    required this.name,
    required this.lat,
    required this.lng,
    required this.order,
  });

  final String stopId;
  final String name;
  final double lat;
  final double lng;
  final int order;
}

class DriverRouteUpdateCommand {
  const DriverRouteUpdateCommand({
    this.companyId,
    required this.routeId,
    this.lastKnownUpdateToken,
    this.name,
    this.startPoint,
    this.startAddress,
    this.endPoint,
    this.endAddress,
    this.scheduledTime,
    this.timeSlot,
    this.allowGuestTracking,
    this.authorizedDriverIds,
    this.isArchived,
    this.vacationUntil,
    this.clearVacationUntil = false,
    this.inlineStopUpserts = const <DriverRouteInlineStopUpsertCommand>[],
  });

  final String? companyId;
  final String routeId;
  final String? lastKnownUpdateToken;
  final String? name;
  final DriverRouteUpdatePoint? startPoint;
  final String? startAddress;
  final DriverRouteUpdatePoint? endPoint;
  final String? endAddress;
  final String? scheduledTime;
  final String? timeSlot;
  final bool? allowGuestTracking;
  final List<String>? authorizedDriverIds;
  final bool? isArchived;
  final String? vacationUntil;
  final bool clearVacationUntil;
  final List<DriverRouteInlineStopUpsertCommand> inlineStopUpserts;
}

abstract class DriverRouteUpdateRepository {
  Future<void> updateRoute(DriverRouteUpdateCommand command);
}
