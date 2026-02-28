class DriverStopUpsertCommand {
  const DriverStopUpsertCommand({
    this.companyId,
    required this.routeId,
    this.lastKnownUpdateToken,
    required this.name,
    required this.lat,
    required this.lng,
    required this.order,
    this.stopId,
  });

  final String? companyId;
  final String routeId;
  final String? lastKnownUpdateToken;
  final String? stopId;
  final String name;
  final double lat;
  final double lng;
  final int order;
}

class DriverStopUpsertResult {
  const DriverStopUpsertResult({
    this.stopId = '-',
    this.updatedAt,
  });

  final String stopId;
  final String? updatedAt;
}

class DriverStopDeleteCommand {
  const DriverStopDeleteCommand({
    this.companyId,
    required this.routeId,
    required this.stopId,
    this.lastKnownUpdateToken,
  });

  final String? companyId;
  final String routeId;
  final String stopId;
  final String? lastKnownUpdateToken;
}

abstract class DriverStopMutationRepository {
  Future<DriverStopUpsertResult> upsertStop(DriverStopUpsertCommand command);

  Future<void> deleteStop(DriverStopDeleteCommand command);
}
