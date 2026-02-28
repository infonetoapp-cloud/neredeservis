class CreateDriverRouteRecentCacheWritePlan {
  const CreateDriverRouteRecentCacheWritePlan({
    required this.uid,
    required this.routeId,
    required this.routeName,
    required this.startAddress,
    required this.endAddress,
    required this.startLat,
    required this.startLng,
    required this.endLat,
    required this.endLng,
    required this.scheduledTime,
    required this.srvCode,
  });

  final String uid;
  final String routeId;
  final String routeName;
  final String startAddress;
  final String endAddress;
  final double startLat;
  final double startLng;
  final double endLat;
  final double endLng;
  final String scheduledTime;
  final String srvCode;
}

class PlanCreateDriverRoutePostCommitHandlingCommand {
  const PlanCreateDriverRoutePostCommitHandlingCommand({
    required this.currentUserUid,
    required this.routeId,
    required this.srvCode,
    required this.routeName,
    required this.startAddress,
    required this.endAddress,
    required this.startLat,
    required this.startLng,
    required this.endLat,
    required this.endLng,
    required this.scheduledTime,
  });

  final String? currentUserUid;
  final String? routeId;
  final String srvCode;
  final String routeName;
  final String startAddress;
  final String endAddress;
  final double startLat;
  final double startLng;
  final double endLat;
  final double endLng;
  final String scheduledTime;
}

class CreateDriverRoutePostCommitHandlingPlan {
  const CreateDriverRoutePostCommitHandlingPlan({
    required this.srvCode,
    required this.driverHomePreviewRouteId,
    required this.shouldForceDriverHomeRefresh,
    required this.recentCacheWrite,
  });

  final String srvCode;
  final String? driverHomePreviewRouteId;
  final bool shouldForceDriverHomeRefresh;
  final CreateDriverRouteRecentCacheWritePlan? recentCacheWrite;
}

class PlanCreateDriverRoutePostCommitHandlingUseCase {
  const PlanCreateDriverRoutePostCommitHandlingUseCase();

  CreateDriverRoutePostCommitHandlingPlan execute(
    PlanCreateDriverRoutePostCommitHandlingCommand command,
  ) {
    final recentCacheWrite =
        command.currentUserUid != null && command.routeId != null
            ? CreateDriverRouteRecentCacheWritePlan(
                uid: command.currentUserUid!,
                routeId: command.routeId!,
                routeName: command.routeName,
                startAddress: command.startAddress,
                endAddress: command.endAddress,
                startLat: command.startLat,
                startLng: command.startLng,
                endLat: command.endLat,
                endLng: command.endLng,
                scheduledTime: command.scheduledTime,
                srvCode: command.srvCode,
              )
            : null;

    return CreateDriverRoutePostCommitHandlingPlan(
      srvCode: command.srvCode,
      driverHomePreviewRouteId: command.routeId,
      shouldForceDriverHomeRefresh: true,
      recentCacheWrite: recentCacheWrite,
    );
  }
}
