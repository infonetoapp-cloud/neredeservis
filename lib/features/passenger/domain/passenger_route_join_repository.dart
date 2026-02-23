class PassengerRouteJoinBySrvCodeCommand {
  const PassengerRouteJoinBySrvCodeCommand({
    required this.srvCode,
    required this.name,
    this.phone,
    required this.showPhoneToDriver,
    required this.boardingArea,
    required this.notificationTime,
  });

  final String srvCode;
  final String name;
  final String? phone;
  final bool showPhoneToDriver;
  final String boardingArea;
  final String notificationTime;
}

class PassengerRouteJoinBySrvCodeResult {
  const PassengerRouteJoinBySrvCodeResult({
    required this.routeId,
    required this.routeName,
  });

  final String routeId;
  final String routeName;
}

abstract class PassengerRouteJoinRepository {
  Future<PassengerRouteJoinBySrvCodeResult> joinBySrvCode(
    PassengerRouteJoinBySrvCodeCommand command,
  );
}
