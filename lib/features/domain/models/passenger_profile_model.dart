class PassengerVirtualStopModel {
  const PassengerVirtualStopModel({
    required this.lat,
    required this.lng,
  });

  final double lat;
  final double lng;

  factory PassengerVirtualStopModel.fromMap(Map<String, dynamic> map) {
    return PassengerVirtualStopModel(
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

class PassengerProfileModel {
  const PassengerProfileModel({
    required this.routeId,
    required this.passengerId,
    required this.name,
    required this.phone,
    required this.showPhoneToDriver,
    required this.boardingArea,
    required this.virtualStop,
    required this.virtualStopLabel,
    required this.notificationTime,
    required this.joinedAt,
    required this.updatedAt,
  });

  final String routeId;
  final String passengerId;
  final String name;
  final String? phone;
  final bool showPhoneToDriver;
  final String boardingArea;
  final PassengerVirtualStopModel? virtualStop;
  final String? virtualStopLabel;
  final String notificationTime;
  final String joinedAt;
  final String updatedAt;

  factory PassengerProfileModel.fromMap(
    Map<String, dynamic> map, {
    required String routeId,
    required String passengerId,
  }) {
    final virtualStopRaw = map['virtualStop'] as Map<String, dynamic>?;

    return PassengerProfileModel(
      routeId: routeId,
      passengerId: passengerId,
      name: map['name'] as String? ?? '',
      phone: map['phone'] as String?,
      showPhoneToDriver: map['showPhoneToDriver'] as bool? ?? false,
      boardingArea: map['boardingArea'] as String? ?? '',
      virtualStop: virtualStopRaw == null
          ? null
          : PassengerVirtualStopModel.fromMap(virtualStopRaw),
      virtualStopLabel: map['virtualStopLabel'] as String?,
      notificationTime: map['notificationTime'] as String? ?? '',
      joinedAt: map['joinedAt'] as String? ?? '',
      updatedAt: map['updatedAt'] as String? ?? '',
    );
  }

  Map<String, dynamic> toMap() {
    return <String, dynamic>{
      'name': name,
      'phone': phone,
      'showPhoneToDriver': showPhoneToDriver,
      'boardingArea': boardingArea,
      'virtualStop': virtualStop?.toMap(),
      'virtualStopLabel': virtualStopLabel,
      'notificationTime': notificationTime,
      'joinedAt': joinedAt,
      'updatedAt': updatedAt,
    };
  }
}
