class PassengerRouteLeaveCommand {
  const PassengerRouteLeaveCommand({
    required this.routeId,
  });

  final String routeId;
}

class PassengerRouteLeaveResult {
  const PassengerRouteLeaveResult({
    required this.left,
  });

  final bool left;
}

abstract class PassengerRouteLeaveRepository {
  Future<PassengerRouteLeaveResult> leaveRoute(
      PassengerRouteLeaveCommand command);
}
