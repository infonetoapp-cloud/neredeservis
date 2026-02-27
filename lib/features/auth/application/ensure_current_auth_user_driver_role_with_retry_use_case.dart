import '../domain/user_role.dart';
import 'promote_current_auth_user_to_driver_role_with_retry_use_case.dart';
import 'read_user_role_use_case.dart';

class EnsureCurrentAuthUserDriverRoleWithRetryCommand {
  const EnsureCurrentAuthUserDriverRoleWithRetryCommand({
    required this.uid,
    required this.displayName,
  });

  final String uid;
  final String displayName;
}

class EnsureCurrentAuthUserDriverRoleWithRetryResult {
  const EnsureCurrentAuthUserDriverRoleWithRetryResult({
    required this.currentRole,
    required this.effectiveRole,
  });

  final UserRole currentRole;
  final UserRole effectiveRole;
}

class EnsureCurrentAuthUserDriverRoleWithRetryUseCase {
  const EnsureCurrentAuthUserDriverRoleWithRetryUseCase({
    required ReadUserRoleUseCase readUserRoleUseCase,
    required PromoteCurrentAuthUserToDriverRoleWithRetryUseCase
        promoteCurrentAuthUserToDriverRoleWithRetryUseCase,
  })  : _readUserRoleUseCase = readUserRoleUseCase,
        _promoteCurrentAuthUserToDriverRoleWithRetryUseCase =
            promoteCurrentAuthUserToDriverRoleWithRetryUseCase;

  final ReadUserRoleUseCase _readUserRoleUseCase;
  final PromoteCurrentAuthUserToDriverRoleWithRetryUseCase
      _promoteCurrentAuthUserToDriverRoleWithRetryUseCase;

  Future<EnsureCurrentAuthUserDriverRoleWithRetryResult> execute(
    EnsureCurrentAuthUserDriverRoleWithRetryCommand command,
  ) async {
    final currentRole = await _readUserRoleUseCase.execute(command.uid);
    if (currentRole.isDriver) {
      return EnsureCurrentAuthUserDriverRoleWithRetryResult(
        currentRole: currentRole,
        effectiveRole: currentRole,
      );
    }

    final promotionResult =
        await _promoteCurrentAuthUserToDriverRoleWithRetryUseCase.execute(
      PromoteCurrentAuthUserToDriverRoleWithRetryCommand(
        displayName: command.displayName,
      ),
    );
    return EnsureCurrentAuthUserDriverRoleWithRetryResult(
      currentRole: currentRole,
      effectiveRole: promotionResult.role,
    );
  }
}
