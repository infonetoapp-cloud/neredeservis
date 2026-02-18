class LiveLocationEntity {
  const LiveLocationEntity({
    required this.routeId,
    required this.lat,
    required this.lng,
    required this.speed,
    required this.heading,
    required this.accuracy,
    required this.timestampMs,
    required this.tripId,
    required this.driverId,
  });

  final String routeId;
  final double lat;
  final double lng;
  final double speed;
  final double heading;
  final double accuracy;
  final int timestampMs;
  final String tripId;
  final String driverId;

  DateTime get sampledAtUtc =>
      DateTime.fromMillisecondsSinceEpoch(timestampMs, isUtc: true);
}
