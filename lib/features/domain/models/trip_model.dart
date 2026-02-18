class TripDriverSnapshotModel {
  const TripDriverSnapshotModel({
    required this.name,
    required this.plate,
    required this.phone,
  });

  final String name;
  final String plate;
  final String? phone;

  factory TripDriverSnapshotModel.fromMap(Map<String, dynamic> map) {
    return TripDriverSnapshotModel(
      name: map['name'] as String? ?? '',
      plate: map['plate'] as String? ?? '',
      phone: map['phone'] as String?,
    );
  }

  Map<String, dynamic> toMap() {
    return <String, dynamic>{
      'name': name,
      'plate': plate,
      'phone': phone,
    };
  }
}

class TripModel {
  const TripModel({
    required this.tripId,
    required this.routeId,
    required this.driverId,
    required this.driverSnapshot,
    required this.status,
    required this.startedAt,
    required this.endedAt,
    required this.lastLocationAt,
    required this.endReason,
    required this.startedByDeviceId,
    required this.transitionVersion,
    required this.updatedAt,
  });

  final String tripId;
  final String routeId;
  final String driverId;
  final TripDriverSnapshotModel driverSnapshot;
  final String status;
  final String startedAt;
  final String? endedAt;
  final String lastLocationAt;
  final String? endReason;
  final String startedByDeviceId;
  final int transitionVersion;
  final String updatedAt;

  factory TripModel.fromMap(Map<String, dynamic> map,
      {required String tripId}) {
    final driverSnapshotRaw =
        map['driverSnapshot'] as Map<String, dynamic>? ?? <String, dynamic>{};

    return TripModel(
      tripId: tripId,
      routeId: map['routeId'] as String? ?? '',
      driverId: map['driverId'] as String? ?? '',
      driverSnapshot: TripDriverSnapshotModel.fromMap(driverSnapshotRaw),
      status: map['status'] as String? ?? '',
      startedAt: map['startedAt'] as String? ?? '',
      endedAt: map['endedAt'] as String?,
      lastLocationAt: map['lastLocationAt'] as String? ?? '',
      endReason: map['endReason'] as String?,
      startedByDeviceId: map['startedByDeviceId'] as String? ?? '',
      transitionVersion: map['transitionVersion'] as int? ?? 0,
      updatedAt: map['updatedAt'] as String? ?? '',
    );
  }

  Map<String, dynamic> toMap() {
    return <String, dynamic>{
      'routeId': routeId,
      'driverId': driverId,
      'driverSnapshot': driverSnapshot.toMap(),
      'status': status,
      'startedAt': startedAt,
      'endedAt': endedAt,
      'lastLocationAt': lastLocationAt,
      'endReason': endReason,
      'startedByDeviceId': startedByDeviceId,
      'transitionVersion': transitionVersion,
      'updatedAt': updatedAt,
    };
  }
}
