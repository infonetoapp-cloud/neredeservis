part of '../app_router.dart';

String _resolveFinishTripCommitMessage(
  DriverFinishTripCommitHandlingPlan handlingPlan,
) {
  final resolvedMessage = _resolveDriverFinishTripCommitFeedbackMessageUseCase
      .execute(handlingPlan);
  if (resolvedMessage != null) {
    return resolvedMessage;
  }
  return _resolveDriverFinishTripMappedFailureFeedbackMessageUseCase.execute(
    errorCode: handlingPlan.errorCode,
    errorMessage: handlingPlan.errorMessage,
  );
}

void _trackFinishTripCommitTelemetry({
  required Stopwatch stopwatch,
  required String tripId,
  required DriverFinishTripCommitHandlingPlan handlingPlan,
}) {
  final eventAttributes = <String, Object?>{
    'result': handlingPlan.telemetryResult,
  };
  if (handlingPlan.includeTripIdInEventTelemetry) {
    eventAttributes['tripId'] = tripId;
  }
  if (handlingPlan.messageKind ==
      DriverFinishTripCommitMessageKind.mappedFailure) {
    eventAttributes['code'] = handlingPlan.telemetryCode;
  }
  _mobileTelemetry.track(
    eventName: MobileEventNames.tripFinish,
    category: 'trip',
    addBreadcrumb: true,
    attributes: eventAttributes,
  );

  final perfAttributes = <String, Object?>{
    'result': handlingPlan.telemetryResult,
  };
  if (handlingPlan.messageKind ==
      DriverFinishTripCommitMessageKind.mappedFailure) {
    perfAttributes['code'] = handlingPlan.telemetryCode;
  }
  _mobileTelemetry.trackPerf(
    eventName: MobileEventNames.finishTripCallableLatency,
    durationMs: stopwatch.elapsedMilliseconds,
    attributes: perfAttributes,
  );
}

Future<_DriverActiveTripContext?> _resolveActiveTripContextForFinish(
  User user, {
  required String? tripId,
  required String? routeId,
  required int? initialTransitionVersion,
}) async {
  final contextSeed = await _resolveDriverActiveTripContextUseCase.execute(
    ResolveDriverActiveTripContextCommand(
      uid: user.uid,
      tripId: tripId,
      routeId: routeId,
      initialTransitionVersion: initialTransitionVersion,
    ),
  );
  if (contextSeed == null) {
    return null;
  }
  return _DriverActiveTripContext(
    routeId: contextSeed.routeId,
    tripId: contextSeed.tripId,
    transitionVersion: contextSeed.transitionVersion,
  );
}
