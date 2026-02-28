import 'create_driver_route_use_case.dart';

class CommitCreateDriverRouteCommand {
  const CommitCreateDriverRouteCommand({
    this.companyId,
    required this.name,
    required this.startLat,
    required this.startLng,
    required this.startAddress,
    required this.endLat,
    required this.endLng,
    required this.endAddress,
    required this.scheduledTime,
    required this.timeSlot,
    required this.allowGuestTracking,
  });

  final String? companyId;
  final String name;
  final double startLat;
  final double startLng;
  final String startAddress;
  final double endLat;
  final double endLng;
  final String endAddress;
  final String scheduledTime;
  final String timeSlot;
  final bool allowGuestTracking;
}

class CommitCreateDriverRouteResult {
  const CommitCreateDriverRouteResult({
    required this.routeId,
    required this.srvCode,
  });

  final String? routeId;
  final String srvCode;
}

class CommitCreateDriverRouteUseCase {
  const CommitCreateDriverRouteUseCase({
    required CreateDriverRouteUseCase createDriverRouteUseCase,
  }) : _createDriverRouteUseCase = createDriverRouteUseCase;

  final CreateDriverRouteUseCase _createDriverRouteUseCase;

  Future<CommitCreateDriverRouteResult> execute(
    CommitCreateDriverRouteCommand command,
  ) async {
    final result = await _createDriverRouteUseCase.execute(
      companyId: command.companyId,
      name: command.name,
      startLat: command.startLat,
      startLng: command.startLng,
      startAddress: command.startAddress,
      endLat: command.endLat,
      endLng: command.endLng,
      endAddress: command.endAddress,
      scheduledTime: command.scheduledTime,
      timeSlot: command.timeSlot,
      allowGuestTracking: command.allowGuestTracking,
    );
    return CommitCreateDriverRouteResult(
      routeId: result.routeId,
      srvCode: result.srvCode,
    );
  }
}
