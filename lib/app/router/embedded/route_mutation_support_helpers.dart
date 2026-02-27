part of '../app_router.dart';

Future<bool> _ensureDriverReadyForRouteMutation(BuildContext context) async {
  final outcomeCommand =
      await _resolveCurrentAuthDriverRouteMutationReadinessUiOutcomeCommandUseCase
          .execute();
  final outcome = _planDriverRouteMutationReadinessUiOutcomeUseCase.execute(
    outcomeCommand,
  );
  if (outcome.allowsRouteMutation) {
    return true;
  }

  if (context.mounted) {
    applyRouterDriverRouteMutationReadinessUiOutcome(
      context,
      outcome: outcome,
      showInfo: _showInfo,
      driverAuthRoute: _buildAuthRouteWithNextRole(_authNextRoleDriver),
    );
  }
  return false;
}

void _rememberRecentDriverCreatedRouteFromPlan(
  CreateDriverRouteRecentCacheWritePlan plan,
) {
  _rememberRecentDriverCreatedRoute(
    uid: plan.uid,
    routeId: plan.routeId,
    routeName: plan.routeName,
    startAddress: plan.startAddress,
    endAddress: plan.endAddress,
    startLat: plan.startLat,
    startLng: plan.startLng,
    endLat: plan.endLat,
    endLng: plan.endLng,
    scheduledTime: plan.scheduledTime,
    srvCode: plan.srvCode,
  );
}

Future<void> _showSrvCodeDialog(
  BuildContext context, {
  required String srvCode,
}) async {
  final normalizedCode = srvCode.trim().isEmpty ? '-' : srvCode.trim();
  final copied = await showRouterSrvCodeDialog(
    context: context,
    srvCode: normalizedCode,
  );
  if (copied && context.mounted) {
    _showInfo(context, 'SRV kodu panoya kopyalandi.');
  }
}
