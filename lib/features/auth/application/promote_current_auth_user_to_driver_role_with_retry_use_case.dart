import '../data/auth_credential_gateway.dart';
import '../domain/user_role.dart';
import 'bootstrap_current_auth_profile_session_use_case.dart';

class PromoteCurrentAuthUserToDriverRoleWithRetryCommand {
  const PromoteCurrentAuthUserToDriverRoleWithRetryCommand({
    required this.displayName,
  });

  final String displayName;
}

class PromoteCurrentAuthUserToDriverRoleWithRetryResult {
  const PromoteCurrentAuthUserToDriverRoleWithRetryResult({
    required this.role,
  });

  final UserRole role;
}

class PromoteCurrentAuthUserToDriverRoleWithRetryUseCase {
  const PromoteCurrentAuthUserToDriverRoleWithRetryUseCase({
    required AuthCredentialGateway authCredentialGateway,
    required BootstrapCurrentAuthProfileSessionUseCase
        bootstrapCurrentAuthProfileSessionUseCase,
  })  : _authCredentialGateway = authCredentialGateway,
        _bootstrapCurrentAuthProfileSessionUseCase =
            bootstrapCurrentAuthProfileSessionUseCase;

  final AuthCredentialGateway _authCredentialGateway;
  final BootstrapCurrentAuthProfileSessionUseCase
      _bootstrapCurrentAuthProfileSessionUseCase;

  Future<PromoteCurrentAuthUserToDriverRoleWithRetryResult> execute(
    PromoteCurrentAuthUserToDriverRoleWithRetryCommand command,
  ) async {
    var bootstrapResult =
        await _bootstrapCurrentAuthProfileSessionUseCase.execute(
      BootstrapCurrentAuthProfileSessionCommand(
        displayName: command.displayName,
        preferredRole: UserRole.driver.name,
      ),
    );
    if (bootstrapResult.role.isDriver) {
      return PromoteCurrentAuthUserToDriverRoleWithRetryResult(
        role: bootstrapResult.role,
      );
    }

    final user = _authCredentialGateway.currentUser;
    if (user == null) {
      return PromoteCurrentAuthUserToDriverRoleWithRetryResult(
        role: bootstrapResult.role,
      );
    }

    try {
      await user.reload();
      await user.getIdToken(true);
    } catch (_) {
      // Continue with a second best-effort bootstrap attempt.
    }

    bootstrapResult = await _bootstrapCurrentAuthProfileSessionUseCase.execute(
      BootstrapCurrentAuthProfileSessionCommand(
        displayName: command.displayName,
        preferredRole: UserRole.driver.name,
      ),
    );
    return PromoteCurrentAuthUserToDriverRoleWithRetryResult(
      role: bootstrapResult.role,
    );
  }
}
