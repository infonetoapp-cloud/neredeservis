class StopGeoPointEntity {
  const StopGeoPointEntity({
    required this.lat,
    required this.lng,
  });

  final double lat;
  final double lng;
}

class StopEntity {
  const StopEntity({
    required this.routeId,
    required this.stopId,
    required this.name,
    required this.location,
    required this.order,
    required this.createdAt,
    required this.updatedAt,
  });

  final String routeId;
  final String stopId;
  final String name;
  final StopGeoPointEntity location;
  final int order;
  final DateTime createdAt;
  final DateTime updatedAt;
}
