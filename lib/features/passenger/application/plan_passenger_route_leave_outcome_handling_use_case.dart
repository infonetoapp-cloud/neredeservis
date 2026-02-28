enum PassengerRouteLeaveOutcomeHandlingKind {
  success,
  noop,
  failure,
}

class PlanPassengerRouteLeaveOutcomeHandlingCommand {
  const PlanPassengerRouteLeaveOutcomeHandlingCommand._({
    required this.kind,
  });

  const PlanPassengerRouteLeaveOutcomeHandlingCommand.success()
      : this._(kind: PassengerRouteLeaveOutcomeHandlingKind.success);

  const PlanPassengerRouteLeaveOutcomeHandlingCommand.noop()
      : this._(kind: PassengerRouteLeaveOutcomeHandlingKind.noop);

  const PlanPassengerRouteLeaveOutcomeHandlingCommand.failure()
      : this._(kind: PassengerRouteLeaveOutcomeHandlingKind.failure);

  final PassengerRouteLeaveOutcomeHandlingKind kind;
}

class PassengerRouteLeaveOutcomeHandlingPlan {
  const PassengerRouteLeaveOutcomeHandlingPlan({
    required this.telemetryResult,
    required this.shouldClearRouteCaches,
    required this.shouldNavigateToJoin,
  });

  final String telemetryResult;
  final bool shouldClearRouteCaches;
  final bool shouldNavigateToJoin;
}

class PlanPassengerRouteLeaveOutcomeHandlingUseCase {
  const PlanPassengerRouteLeaveOutcomeHandlingUseCase();

  PassengerRouteLeaveOutcomeHandlingPlan execute(
    PlanPassengerRouteLeaveOutcomeHandlingCommand command,
  ) {
    switch (command.kind) {
      case PassengerRouteLeaveOutcomeHandlingKind.success:
        return const PassengerRouteLeaveOutcomeHandlingPlan(
          telemetryResult: 'success',
          shouldClearRouteCaches: true,
          shouldNavigateToJoin: true,
        );
      case PassengerRouteLeaveOutcomeHandlingKind.noop:
        return const PassengerRouteLeaveOutcomeHandlingPlan(
          telemetryResult: 'noop',
          shouldClearRouteCaches: false,
          shouldNavigateToJoin: true,
        );
      case PassengerRouteLeaveOutcomeHandlingKind.failure:
        return const PassengerRouteLeaveOutcomeHandlingPlan(
          telemetryResult: 'error',
          shouldClearRouteCaches: false,
          shouldNavigateToJoin: false,
        );
    }
  }
}
