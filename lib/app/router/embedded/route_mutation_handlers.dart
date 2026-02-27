part of '../app_router.dart';

Future<void> _handleCreateRoute(
  BuildContext context,
  RouteCreateFormInput input,
) async {
  final canProceed = await ensureRouterRouteMutationHandlerCanProceed(
    context,
    ensureReady: _ensureDriverReadyForRouteMutation,
  );
  if (!canProceed) {
    return;
  }

  try {
    final result = await _commitCreateDriverRouteUseCase.execute(
      CommitCreateDriverRouteCommand(
        name: input.name,
        startLat: input.startLat,
        startLng: input.startLng,
        startAddress: input.startAddress,
        endLat: input.endLat,
        endLng: input.endLng,
        endAddress: input.endAddress,
        scheduledTime: input.scheduledTime,
        timeSlot: input.timeSlot,
        allowGuestTracking: input.allowGuestTracking,
      ),
    );
    final routeId = result.routeId;
    final srvCode = result.srvCode;
    final postCommitPlan =
        _planCreateDriverRoutePostCommitHandlingUseCase.execute(
      PlanCreateDriverRoutePostCommitHandlingCommand(
        currentUserUid: _authCredentialGateway.currentUser?.uid,
        routeId: routeId,
        srvCode: srvCode,
        routeName: input.name,
        startAddress: input.startAddress,
        endAddress: input.endAddress,
        startLat: input.startLat,
        startLng: input.startLng,
        endLat: input.endLat,
        endLng: input.endLng,
        scheduledTime: input.scheduledTime,
      ),
    );
    applyRouterCreateDriverRoutePostCommitCacheWritePlan(
      plan: postCommitPlan,
      rememberRecentDriverCreatedRouteFromPlan:
          _rememberRecentDriverCreatedRouteFromPlan,
    );
    if (!context.mounted) {
      return;
    }
    await executeRouterCreateDriverRoutePostCommitUiEffects(
      context,
      plan: postCommitPlan,
      showSrvCodeDialog: _showSrvCodeDialog,
      buildDriverHomeRoute: _buildDriverHomeRoute,
    );
  } on FirebaseFunctionsException catch (error) {
    if (!context.mounted) {
      return;
    }
    executeRouterCreateDriverRouteFailureOutcome(
      context,
      error: error,
      planner: _planCreateDriverRouteFailureHandlingUseCase,
      showInfo: _showInfo,
    );
  }
}

Future<void> _handleUpdateRoute(
  BuildContext context,
  RouteUpdateFormInput input,
) async {
  await executeRouterRouteMutationWriteAction(
    context,
    runCommitAndBuildSuccessCommand: () async {
      await _commitUpdateDriverRouteUseCase.execute(
        CommitUpdateDriverRouteCommand(
          routeId: input.routeId,
          name: input.name,
          startAddress: input.startAddress,
          startPoint: input.startPoint == null
              ? null
              : CommitUpdateDriverRoutePoint(
                  lat: input.startPoint!.lat,
                  lng: input.startPoint!.lng,
                ),
          endAddress: input.endAddress,
          endPoint: input.endPoint == null
              ? null
              : CommitUpdateDriverRoutePoint(
                  lat: input.endPoint!.lat,
                  lng: input.endPoint!.lng,
                ),
          scheduledTime: input.scheduledTime,
          timeSlot: input.timeSlot,
          allowGuestTracking: input.allowGuestTracking,
          authorizedDriverIds: input.authorizedDriverIds,
          isArchived: input.isArchived,
          clearVacationUntil: input.clearVacationUntil,
          vacationUntil: input.vacationUntil,
          inlineStopUpserts: input.inlineStopUpserts
              .map(
                (stop) => CommitUpdateDriverRouteInlineStopUpsert(
                  stopId: stop.stopId,
                  name: stop.name,
                  lat: stop.lat,
                  lng: stop.lng,
                  order: stop.order,
                ),
              )
              .toList(growable: false),
        ),
      );
      return PlanRouteMutationWriteSuccessHandlingCommand.routeUpdateSuccess(
        inlineStopUpsertsCount: input.inlineStopUpserts.length,
      );
    },
    successPlanner: _planRouteMutationWriteSuccessHandlingUseCase,
    failurePlanner: _planRouteMutationWriteFailureHandlingUseCase,
    failureCommand:
        const PlanRouteMutationWriteFailureHandlingCommand.routeUpdateFailure(),
    showInfo: _showInfo,
  );
}

Future<void> _handleUpsertStop(
  BuildContext context,
  StopUpsertFormInput input,
) async {
  await executeRouterRouteMutationWriteAction(
    context,
    runCommitAndBuildSuccessCommand: () async {
      final result = await _commitUpsertDriverStopUseCase.execute(
        CommitUpsertDriverStopCommand(
          routeId: input.routeId,
          stopId: input.stopId,
          name: input.name,
          lat: input.lat,
          lng: input.lng,
          order: input.order,
        ),
      );
      return PlanRouteMutationWriteSuccessHandlingCommand.upsertStopSuccess(
        stopId: result.stopId,
      );
    },
    successPlanner: _planRouteMutationWriteSuccessHandlingUseCase,
    failurePlanner: _planRouteMutationWriteFailureHandlingUseCase,
    failureCommand:
        const PlanRouteMutationWriteFailureHandlingCommand.upsertStopFailure(),
    showInfo: _showInfo,
  );
}

Future<void> _handleDeleteStop(
  BuildContext context,
  StopDeleteFormInput input,
) async {
  await executeRouterRouteMutationWriteAction(
    context,
    runCommitAndBuildSuccessCommand: () async {
      await _commitDeleteDriverStopUseCase.execute(
        CommitDeleteDriverStopCommand(
          routeId: input.routeId,
          stopId: input.stopId,
        ),
      );
      return const PlanRouteMutationWriteSuccessHandlingCommand
          .deleteStopSuccess();
    },
    successPlanner: _planRouteMutationWriteSuccessHandlingUseCase,
    failurePlanner: _planRouteMutationWriteFailureHandlingUseCase,
    failureCommand:
        const PlanRouteMutationWriteFailureHandlingCommand.deleteStopFailure(),
    showInfo: _showInfo,
  );
}
