class PassengerSettingsUpdateVirtualStop {
  const PassengerSettingsUpdateVirtualStop({
    required this.lat,
    required this.lng,
  });

  final double lat;
  final double lng;
}

class PassengerSettingsUpdateCommand {
  const PassengerSettingsUpdateCommand({
    required this.routeId,
    required this.showPhoneToDriver,
    required this.boardingArea,
    required this.notificationTime,
    this.phone,
    this.virtualStop,
    this.virtualStopLabel,
  });

  final String routeId;
  final String? phone;
  final bool showPhoneToDriver;
  final String boardingArea;
  final String notificationTime;
  final PassengerSettingsUpdateVirtualStop? virtualStop;
  final String? virtualStopLabel;
}

abstract class PassengerSettingsUpdateRepository {
  Future<void> updateSettings(PassengerSettingsUpdateCommand command);
}
