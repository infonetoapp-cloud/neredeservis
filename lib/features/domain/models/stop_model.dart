class StopGeoPointModel {
  const StopGeoPointModel({
    required this.lat,
    required this.lng,
  });

  final double lat;
  final double lng;

  factory StopGeoPointModel.fromMap(Map<String, dynamic> map) {
    return StopGeoPointModel(
      lat: (map['lat'] as num?)?.toDouble() ?? 0,
      lng: (map['lng'] as num?)?.toDouble() ?? 0,
    );
  }

  Map<String, dynamic> toMap() {
    return <String, dynamic>{
      'lat': lat,
      'lng': lng,
    };
  }
}

class StopModel {
  const StopModel({
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
  final StopGeoPointModel location;
  final int order;
  final String createdAt;
  final String updatedAt;

  factory StopModel.fromMap(
    Map<String, dynamic> map, {
    required String routeId,
    required String stopId,
  }) {
    final locationRaw =
        map['location'] as Map<String, dynamic>? ?? <String, dynamic>{};

    return StopModel(
      routeId: routeId,
      stopId: stopId,
      name: map['name'] as String? ?? '',
      location: StopGeoPointModel.fromMap(locationRaw),
      order: map['order'] as int? ?? 0,
      createdAt: map['createdAt'] as String? ?? '',
      updatedAt: map['updatedAt'] as String? ?? '',
    );
  }

  Map<String, dynamic> toMap() {
    return <String, dynamic>{
      'name': name,
      'location': location.toMap(),
      'order': order,
      'createdAt': createdAt,
      'updatedAt': updatedAt,
    };
  }
}
