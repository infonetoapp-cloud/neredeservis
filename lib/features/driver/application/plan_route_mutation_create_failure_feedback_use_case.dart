import 'classify_route_mutation_create_failure_use_case.dart';

enum RouteMutationCreateFailureFeedbackKey {
  unauthenticated,
  permissionDenied,
  invalidArgument,
  driverProfilePrecondition,
  srvCodeCollisionLimit,
  routeCreateFailed,
  resourceExhausted,
  retryableUnavailable,
  routeCreateFailedWithCode,
}

class PlanRouteMutationCreateFailureFeedbackCommand {
  const PlanRouteMutationCreateFailureFeedbackCommand({
    required this.code,
    required this.message,
  });

  final String code;
  final String? message;
}

class RouteMutationCreateFailureFeedbackPlan {
  const RouteMutationCreateFailureFeedbackPlan({
    required this.key,
    this.codeLabel,
  });

  final RouteMutationCreateFailureFeedbackKey key;
  final String? codeLabel;
}

class PlanRouteMutationCreateFailureFeedbackUseCase {
  const PlanRouteMutationCreateFailureFeedbackUseCase({
    required ClassifyRouteMutationCreateFailureUseCase
        classifyRouteMutationCreateFailureUseCase,
  }) : _classifyRouteMutationCreateFailureUseCase =
            classifyRouteMutationCreateFailureUseCase;

  final ClassifyRouteMutationCreateFailureUseCase
      _classifyRouteMutationCreateFailureUseCase;

  RouteMutationCreateFailureFeedbackPlan execute(
    PlanRouteMutationCreateFailureFeedbackCommand command,
  ) {
    final classification = _classifyRouteMutationCreateFailureUseCase.execute(
      ClassifyRouteMutationCreateFailureCommand(
        code: command.code,
        message: command.message,
      ),
    );

    switch (classification.normalizedCode) {
      case 'unauthenticated':
        return const RouteMutationCreateFailureFeedbackPlan(
          key: RouteMutationCreateFailureFeedbackKey.unauthenticated,
        );
      case 'permission-denied':
        return const RouteMutationCreateFailureFeedbackPlan(
          key: RouteMutationCreateFailureFeedbackKey.permissionDenied,
        );
      case 'invalid-argument':
        return const RouteMutationCreateFailureFeedbackPlan(
          key: RouteMutationCreateFailureFeedbackKey.invalidArgument,
        );
      case 'failed-precondition':
        if (classification.kind ==
            RouteMutationCreateFailureKind.driverProfilePrecondition) {
          return const RouteMutationCreateFailureFeedbackPlan(
            key:
                RouteMutationCreateFailureFeedbackKey.driverProfilePrecondition,
          );
        }
        if (classification.normalizedMessage
            .contains('srv_code_collision_limit')) {
          return const RouteMutationCreateFailureFeedbackPlan(
            key: RouteMutationCreateFailureFeedbackKey.srvCodeCollisionLimit,
          );
        }
        return const RouteMutationCreateFailureFeedbackPlan(
          key: RouteMutationCreateFailureFeedbackKey.routeCreateFailed,
        );
      case 'resource-exhausted':
        return const RouteMutationCreateFailureFeedbackPlan(
          key: RouteMutationCreateFailureFeedbackKey.resourceExhausted,
        );
      case 'unavailable':
      case 'deadline-exceeded':
        return const RouteMutationCreateFailureFeedbackPlan(
          key: RouteMutationCreateFailureFeedbackKey.retryableUnavailable,
        );
      default:
        final codeLabel =
            command.code.trim().isEmpty ? 'unknown' : command.code;
        return RouteMutationCreateFailureFeedbackPlan(
          key: RouteMutationCreateFailureFeedbackKey.routeCreateFailedWithCode,
          codeLabel: codeLabel,
        );
    }
  }
}
