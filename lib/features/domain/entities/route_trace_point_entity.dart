class RouteTracePointEntity {
  const RouteTracePointEntity({
    required this.lat,
    required this.lng,
    required this.accuracy,
    required this.sampledAtMs,
  });

  final double lat;
  final double lng;
  final double accuracy;
  final int sampledAtMs;
}
