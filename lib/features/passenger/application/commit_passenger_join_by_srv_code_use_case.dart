import '../domain/passenger_route_join_repository.dart';
import 'join_passenger_route_by_srv_code_use_case.dart';

class CommitPassengerJoinBySrvCodeCommand {
  const CommitPassengerJoinBySrvCodeCommand({
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

class CommitPassengerJoinBySrvCodeResult {
  const CommitPassengerJoinBySrvCodeResult({
    required this.routeId,
    required this.routeName,
  });

  final String routeId;
  final String routeName;

  bool get hasCompleteRouteResponse => routeId.isNotEmpty;
  String get trimmedRouteName => routeName.trim();
}

class CommitPassengerJoinBySrvCodeUseCase {
  CommitPassengerJoinBySrvCodeUseCase({
    required JoinPassengerRouteBySrvCodeUseCase joinPassengerRouteBySrvCodeUseCase,
  }) : _joinPassengerRouteBySrvCodeUseCase = joinPassengerRouteBySrvCodeUseCase;

  final JoinPassengerRouteBySrvCodeUseCase _joinPassengerRouteBySrvCodeUseCase;

  Future<CommitPassengerJoinBySrvCodeResult> execute(
    CommitPassengerJoinBySrvCodeCommand command,
  ) async {
    final result = await _joinPassengerRouteBySrvCodeUseCase.execute(
      PassengerRouteJoinBySrvCodeCommand(
        srvCode: command.srvCode,
        name: command.name,
        phone: command.phone,
        showPhoneToDriver: command.showPhoneToDriver,
        boardingArea: command.boardingArea,
        notificationTime: command.notificationTime,
      ),
    );
    return CommitPassengerJoinBySrvCodeResult(
      routeId: result.routeId,
      routeName: result.routeName,
    );
  }
}
