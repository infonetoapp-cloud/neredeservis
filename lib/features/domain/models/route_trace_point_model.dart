class RouteTracePointModel {
  const RouteTracePointModel({
    required this.lat,
    required this.lng,
    required this.accuracy,
    required this.sampledAtMs,
  });

  final double lat;
  final double lng;
  final double accuracy;
  final int sampledAtMs;

  factory RouteTracePointModel.fromMap(Map<String, dynamic> map) {
    return RouteTracePointModel(
      lat: (map['lat'] as num?)?.toDouble() ?? 0,
      lng: (map['lng'] as num?)?.toDouble() ?? 0,
      accuracy: (map['accuracy'] as num?)?.toDouble() ?? 0,
      sampledAtMs: map['sampledAtMs'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toMap() {
    return <String, dynamic>{
      'lat': lat,
      'lng': lng,
      'accuracy': accuracy,
      'sampledAtMs': sampledAtMs,
    };
  }
}
