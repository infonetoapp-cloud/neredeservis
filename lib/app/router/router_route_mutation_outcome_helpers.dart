import 'package:cloud_functions/cloud_functions.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../features/driver/application/plan_create_driver_route_failure_handling_use_case.dart';
import '../../features/driver/application/plan_driver_route_mutation_readiness_ui_outcome_use_case.dart';
import '../../features/driver/application/plan_route_mutation_write_failure_handling_use_case.dart';
import '../../features/driver/application/plan_route_mutation_write_success_handling_use_case.dart';
import 'app_route_paths.dart';

typedef RouterShowInfoFeedback = void Function(
  BuildContext context,
  String message,
);

Future<bool> ensureRouterRouteMutationHandlerCanProceed(
  BuildContext context, {
  required Future<bool> Function(BuildContext context) ensureReady,
}) async {
  final ready = await ensureReady(context);
  return ready && context.mounted;
}

Future<void> executeRouterRouteMutationWriteAction(
  BuildContext context, {
  required Future<PlanRouteMutationWriteSuccessHandlingCommand> Function()
      runCommitAndBuildSuccessCommand,
  required PlanRouteMutationWriteSuccessHandlingUseCase successPlanner,
  required PlanRouteMutationWriteFailureHandlingUseCase failurePlanner,
  required PlanRouteMutationWriteFailureHandlingCommand failureCommand,
  required RouterShowInfoFeedback showInfo,
}) async {
  try {
    final successCommand = await runCommitAndBuildSuccessCommand();
    if (!context.mounted) {
      return;
    }
    showRouterRouteMutationWriteSuccessOutcome(
      context,
      planner: successPlanner,
      command: successCommand,
      showInfo: showInfo,
    );
  } on FirebaseFunctionsException catch (error) {
    if (context.mounted && _shouldRedirectToForceUpdate(error)) {
      context.go(AppRoutePath.forceUpdate);
      return;
    }
    final failureCommandWithError = failureCommand.withError(
      errorCode: error.code,
      errorMessage: error.message,
      errorDetails: error.details,
    );
    if (!context.mounted) {
      return;
    }
    showRouterRouteMutationWriteFailureOutcome(
      context,
      planner: failurePlanner,
      command: failureCommandWithError,
      showInfo: showInfo,
    );
  }
}

void applyRouterDriverRouteMutationReadinessUiOutcome(
  BuildContext context, {
  required DriverRouteMutationReadinessUiOutcomePlan outcome,
  required RouterShowInfoFeedback showInfo,
  required String driverAuthRoute,
}) {
  final feedbackMessage = outcome.feedbackMessage;
  if (feedbackMessage != null) {
    showInfo(context, feedbackMessage);
  }

  switch (outcome.navigationKind) {
    case DriverRouteMutationReadinessUiNavigationKind.none:
      return;
    case DriverRouteMutationReadinessUiNavigationKind
          .pushAuthWithDriverNextRole:
      context.push(driverAuthRoute);
      return;
    case DriverRouteMutationReadinessUiNavigationKind.goRoleSelect:
      context.go(AppRoutePath.roleSelect);
      return;
    case DriverRouteMutationReadinessUiNavigationKind.goDriverProfileSetup:
      context.go(AppRoutePath.driverProfileSetup);
      return;
  }
}

void executeRouterCreateDriverRouteFailureOutcome(
  BuildContext context, {
  required FirebaseFunctionsException error,
  required PlanCreateDriverRouteFailureHandlingUseCase planner,
  required RouterShowInfoFeedback showInfo,
}) {
  if (_shouldRedirectToForceUpdate(error)) {
    context.go(AppRoutePath.forceUpdate);
    return;
  }
  final failurePlan = planner.execute(
    PlanCreateDriverRouteFailureHandlingCommand(
      code: error.code,
      message: error.message,
    ),
  );
  showInfo(context, failurePlan.feedbackMessage);
  if (failurePlan.action ==
      CreateDriverRouteFailureHandlingAction
          .showInfoAndRedirectDriverProfileSetup) {
    context.go(AppRoutePath.driverProfileSetup);
  }
}

void showRouterRouteMutationWriteSuccessOutcome(
  BuildContext context, {
  required PlanRouteMutationWriteSuccessHandlingUseCase planner,
  required PlanRouteMutationWriteSuccessHandlingCommand command,
  required RouterShowInfoFeedback showInfo,
}) {
  final successPlan = planner.execute(command);
  showInfo(context, successPlan.feedbackMessage);
}

void showRouterRouteMutationWriteFailureOutcome(
  BuildContext context, {
  required PlanRouteMutationWriteFailureHandlingUseCase planner,
  required PlanRouteMutationWriteFailureHandlingCommand command,
  required RouterShowInfoFeedback showInfo,
}) {
  final failurePlan = planner.execute(command);
  showInfo(context, failurePlan.feedbackMessage);
}

bool _shouldRedirectToForceUpdate(FirebaseFunctionsException error) {
  final normalizedCode = error.code.trim().toUpperCase();
  if (normalizedCode == 'UPGRADE_REQUIRED' ||
      normalizedCode == 'FORCE_UPDATE_REQUIRED') {
    return true;
  }
  final reasonCode = _resolveReasonCode(error.details, error.message);
  return reasonCode == 'UPGRADE_REQUIRED' ||
      reasonCode == 'FORCE_UPDATE_REQUIRED';
}

String? _resolveReasonCode(Object? details, String? message) {
  if (details is Map<Object?, Object?>) {
    final detailMap = Map<String, dynamic>.from(details);
    final reasonFromKey = detailMap['reasonCode'];
    if (reasonFromKey is String && reasonFromKey.trim().isNotEmpty) {
      return reasonFromKey.trim().toUpperCase();
    }
    final reasonFromAltKey = detailMap['reason'];
    if (reasonFromAltKey is String && reasonFromAltKey.trim().isNotEmpty) {
      return reasonFromAltKey.trim().toUpperCase();
    }
  }

  final normalizedMessage = (message ?? '').trim().toUpperCase();
  if (normalizedMessage.contains('FORCE_UPDATE_REQUIRED')) {
    return 'FORCE_UPDATE_REQUIRED';
  }
  if (normalizedMessage.contains('UPGRADE_REQUIRED')) {
    return 'UPGRADE_REQUIRED';
  }
  return null;
}
