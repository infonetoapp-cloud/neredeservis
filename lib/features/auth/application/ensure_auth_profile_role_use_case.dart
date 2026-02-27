import '../domain/user_role.dart';
import 'bootstrap_current_auth_profile_session_use_case.dart';
import 'read_user_role_use_case.dart';

class EnsureAuthProfileRoleCommand {
  const EnsureAuthProfileRoleCommand({
    required this.uid,
    required this.displayName,
    required this.targetRole,
  });

  final String uid;
  final String displayName;
  final UserRole targetRole;
}

class EnsureAuthProfileRoleResult {
  const EnsureAuthProfileRoleResult({
    required this.currentRole,
    required this.effectiveRole,
  });

  final UserRole currentRole;
  final UserRole effectiveRole;
}

class EnsureAuthProfileRoleUseCase {
  const EnsureAuthProfileRoleUseCase({
    required ReadUserRoleUseCase readUserRoleUseCase,
    required BootstrapCurrentAuthProfileSessionUseCase
        bootstrapCurrentAuthProfileSessionUseCase,
  }) : _readUserRoleUseCase = readUserRoleUseCase,
       _bootstrapCurrentAuthProfileSessionUseCase =
           bootstrapCurrentAuthProfileSessionUseCase;

  final ReadUserRoleUseCase _readUserRoleUseCase;
  final BootstrapCurrentAuthProfileSessionUseCase
      _bootstrapCurrentAuthProfileSessionUseCase;

  Future<EnsureAuthProfileRoleResult> execute(
    EnsureAuthProfileRoleCommand command,
  ) async {
    final currentRole = await _readUserRoleUseCase.execute(command.uid);
    if (currentRole == command.targetRole) {
      return EnsureAuthProfileRoleResult(
        currentRole: currentRole,
        effectiveRole: currentRole,
      );
    }

    final bootstrapResult = await _bootstrapCurrentAuthProfileSessionUseCase
        .execute(
      BootstrapCurrentAuthProfileSessionCommand(
        displayName: command.displayName,
        preferredRole: command.targetRole == UserRole.unknown
            ? null
            : command.targetRole.name,
      ),
    );
    return EnsureAuthProfileRoleResult(
      currentRole: currentRole,
      effectiveRole: bootstrapResult.role,
    );
  }
}
