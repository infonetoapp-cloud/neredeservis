class RouteGeoPointModel {
  const RouteGeoPointModel({
    required this.lat,
    required this.lng,
  });

  final double lat;
  final double lng;

  factory RouteGeoPointModel.fromMap(Map<String, dynamic> map) {
    return RouteGeoPointModel(
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

class RouteModel {
  const RouteModel({
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
  final String visibility;
  final bool allowGuestTracking;
  final String creationMode;
  final String? routePolyline;
  final RouteGeoPointModel startPoint;
  final String startAddress;
  final RouteGeoPointModel endPoint;
  final String endAddress;
  final String scheduledTime;
  final String timeSlot;
  final bool isArchived;
  final String? vacationUntil;
  final int passengerCount;
  final String? lastTripStartedNotificationAt;
  final String createdAt;
  final String updatedAt;

  factory RouteModel.fromMap(Map<String, dynamic> map,
      {required String routeId}) {
    final startPointRaw = map['startPoint'] as Map<String, dynamic>? ??
        <String, dynamic>{'lat': 0, 'lng': 0};
    final endPointRaw = map['endPoint'] as Map<String, dynamic>? ??
        <String, dynamic>{'lat': 0, 'lng': 0};

    return RouteModel(
      routeId: routeId,
      name: map['name'] as String? ?? '',
      driverId: map['driverId'] as String? ?? '',
      authorizedDriverIds:
          (map['authorizedDriverIds'] as List<dynamic>? ?? const <dynamic>[])
              .whereType<String>()
              .toList(growable: false),
      memberIds: (map['memberIds'] as List<dynamic>? ?? const <dynamic>[])
          .whereType<String>()
          .toList(growable: false),
      companyId: map['companyId'] as String?,
      srvCode: map['srvCode'] as String? ?? '',
      visibility: map['visibility'] as String? ?? 'private',
      allowGuestTracking: map['allowGuestTracking'] as bool? ?? false,
      creationMode: map['creationMode'] as String? ?? '',
      routePolyline: map['routePolyline'] as String?,
      startPoint: RouteGeoPointModel.fromMap(startPointRaw),
      startAddress: map['startAddress'] as String? ?? '',
      endPoint: RouteGeoPointModel.fromMap(endPointRaw),
      endAddress: map['endAddress'] as String? ?? '',
      scheduledTime: map['scheduledTime'] as String? ?? '',
      timeSlot: map['timeSlot'] as String? ?? '',
      isArchived: map['isArchived'] as bool? ?? false,
      vacationUntil: map['vacationUntil'] as String?,
      passengerCount: map['passengerCount'] as int? ?? 0,
      lastTripStartedNotificationAt:
          map['lastTripStartedNotificationAt'] as String?,
      createdAt: map['createdAt'] as String? ?? '',
      updatedAt: map['updatedAt'] as String? ?? '',
    );
  }

  Map<String, dynamic> toMap() {
    return <String, dynamic>{
      'name': name,
      'driverId': driverId,
      'authorizedDriverIds': authorizedDriverIds,
      'memberIds': memberIds,
      'companyId': companyId,
      'srvCode': srvCode,
      'visibility': visibility,
      'allowGuestTracking': allowGuestTracking,
      'creationMode': creationMode,
      'routePolyline': routePolyline,
      'startPoint': startPoint.toMap(),
      'startAddress': startAddress,
      'endPoint': endPoint.toMap(),
      'endAddress': endAddress,
      'scheduledTime': scheduledTime,
      'timeSlot': timeSlot,
      'isArchived': isArchived,
      'vacationUntil': vacationUntil,
      'passengerCount': passengerCount,
      'lastTripStartedNotificationAt': lastTripStartedNotificationAt,
      'createdAt': createdAt,
      'updatedAt': updatedAt,
    };
  }
}
