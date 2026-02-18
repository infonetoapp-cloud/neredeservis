class LiveLocationModel {
  const LiveLocationModel({
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

  factory LiveLocationModel.fromMap(
    Map<String, dynamic> map, {
    required String routeId,
  }) {
    return LiveLocationModel(
      routeId: routeId,
      lat: (map['lat'] as num?)?.toDouble() ?? 0,
      lng: (map['lng'] as num?)?.toDouble() ?? 0,
      speed: (map['speed'] as num?)?.toDouble() ?? 0,
      heading: (map['heading'] as num?)?.toDouble() ?? 0,
      accuracy: (map['accuracy'] as num?)?.toDouble() ?? 0,
      timestampMs: (map['timestamp'] as num?)?.toInt() ?? 0,
      tripId: map['tripId'] as String? ?? '',
      driverId: map['driverId'] as String? ?? '',
    );
  }

  Map<String, dynamic> toMap() {
    return <String, dynamic>{
      'lat': lat,
      'lng': lng,
      'speed': speed,
      'heading': heading,
      'accuracy': accuracy,
      'timestamp': timestampMs,
      'tripId': tripId,
      'driverId': driverId,
    };
  }
}
