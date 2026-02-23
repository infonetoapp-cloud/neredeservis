class DriverStopUpsertCommand {
  const DriverStopUpsertCommand({
    required this.routeId,
    required this.name,
    required this.lat,
    required this.lng,
    required this.order,
    this.stopId,
  });

  final String routeId;
  final String? stopId;
  final String name;
  final double lat;
  final double lng;
  final int order;
}

class DriverStopUpsertResult {
  const DriverStopUpsertResult({
    this.stopId = '-',
  });

  final String stopId;
}

class DriverStopDeleteCommand {
  const DriverStopDeleteCommand({
    required this.routeId,
    required this.stopId,
  });

  final String routeId;
  final String stopId;
}

abstract class DriverStopMutationRepository {
  Future<DriverStopUpsertResult> upsertStop(DriverStopUpsertCommand command);

  Future<void> deleteStop(DriverStopDeleteCommand command);
}
