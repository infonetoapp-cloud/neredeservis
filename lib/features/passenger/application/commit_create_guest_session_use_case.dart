import '../domain/guest_session_create_repository.dart';
import 'create_guest_session_use_case.dart';

class CommitCreateGuestSessionCommand {
  const CommitCreateGuestSessionCommand({
    required this.srvCode,
    this.name,
  });

  final String srvCode;
  final String? name;
}

class CommitCreateGuestSessionResult {
  const CommitCreateGuestSessionResult({
    required this.routeId,
    this.routeName,
    required this.sessionId,
    required this.expiresAt,
  });

  final String routeId;
  final String? routeName;
  final String sessionId;
  final String expiresAt;

  bool get hasCompleteSessionResponse =>
      routeId.isNotEmpty && sessionId.isNotEmpty && expiresAt.isNotEmpty;
}

class CommitCreateGuestSessionUseCase {
  CommitCreateGuestSessionUseCase({
    required CreateGuestSessionUseCase createGuestSessionUseCase,
  }) : _createGuestSessionUseCase = createGuestSessionUseCase;

  final CreateGuestSessionUseCase _createGuestSessionUseCase;

  Future<CommitCreateGuestSessionResult> execute(
    CommitCreateGuestSessionCommand command,
  ) async {
    final result = await _createGuestSessionUseCase.execute(
      CreateGuestSessionCommand(
        srvCode: command.srvCode,
        name: _nullableName(command.name),
      ),
    );
    return CommitCreateGuestSessionResult(
      routeId: result.routeId,
      routeName: _nullableName(result.routeName),
      sessionId: result.sessionId,
      expiresAt: result.expiresAt,
    );
  }

  String? _nullableName(String? value) {
    final trimmed = value?.trim();
    if (trimmed == null || trimmed.isEmpty) {
      return null;
    }
    return trimmed;
  }
}
