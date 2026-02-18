class PassengerVirtualStopEntity {
  const PassengerVirtualStopEntity({
    required this.lat,
    required this.lng,
  });

  final double lat;
  final double lng;
}

class PassengerProfileEntity {
  const PassengerProfileEntity({
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
  final PassengerVirtualStopEntity? virtualStop;
  final String? virtualStopLabel;
  final String notificationTime;
  final DateTime joinedAt;
  final DateTime updatedAt;
}
