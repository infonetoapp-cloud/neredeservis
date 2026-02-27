enum RouteMutationCreateFailureKind {
  driverProfilePrecondition,
  other,
}

class ClassifyRouteMutationCreateFailureCommand {
  const ClassifyRouteMutationCreateFailureCommand({
    required this.code,
    required this.message,
  });

  final String code;
  final String? message;
}

class ClassifyRouteMutationCreateFailureResult {
  const ClassifyRouteMutationCreateFailureResult({
    required this.kind,
    required this.normalizedCode,
    required this.normalizedMessage,
  });

  final RouteMutationCreateFailureKind kind;
  final String normalizedCode;
  final String normalizedMessage;
}

class ClassifyRouteMutationCreateFailureUseCase {
  const ClassifyRouteMutationCreateFailureUseCase();

  ClassifyRouteMutationCreateFailureResult execute(
    ClassifyRouteMutationCreateFailureCommand command,
  ) {
    final normalizedCode = command.code.trim().toLowerCase();
    final normalizedMessage = (command.message ?? '').trim().toLowerCase();

    final looksLikeDriverProfileIssue =
        normalizedMessage.contains('driver profile') ||
            normalizedMessage.contains('sofor profil');

    final kind =
        normalizedCode == 'failed-precondition' && looksLikeDriverProfileIssue
            ? RouteMutationCreateFailureKind.driverProfilePrecondition
            : RouteMutationCreateFailureKind.other;

    return ClassifyRouteMutationCreateFailureResult(
      kind: kind,
      normalizedCode: normalizedCode,
      normalizedMessage: normalizedMessage,
    );
  }
}
