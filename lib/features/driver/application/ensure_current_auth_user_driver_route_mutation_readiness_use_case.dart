import '../../auth/application/promote_current_auth_user_to_driver_role_with_retry_use_case.dart';
import '../../auth/application/read_user_role_use_case.dart';
import '../../auth/domain/user_role.dart';
import 'resolve_driver_entry_destination_use_case.dart';

class EnsureCurrentAuthUserDriverRouteMutationReadinessCommand {
  const EnsureCurrentAuthUserDriverRouteMutationReadinessCommand({
    required this.uid,
    required this.displayName,
  });

  final String uid;
  final String displayName;
}

class EnsureCurrentAuthUserDriverRouteMutationReadinessResult {
  const EnsureCurrentAuthUserDriverRouteMutationReadinessResult({
    required this.currentRole,
    required this.effectiveRole,
    required this.destination,
  });

  final UserRole currentRole;
  final UserRole effectiveRole;
  final DriverEntryDestination? destination;
}

class EnsureCurrentAuthUserDriverRouteMutationReadinessUseCase {
  const EnsureCurrentAuthUserDriverRouteMutationReadinessUseCase({
    required ReadUserRoleUseCase readUserRoleUseCase,
    required PromoteCurrentAuthUserToDriverRoleWithRetryUseCase
        promoteCurrentAuthUserToDriverRoleWithRetryUseCase,
    required ResolveDriverEntryDestinationUseCase
        resolveDriverEntryDestinationUseCase,
  })  : _readUserRoleUseCase = readUserRoleUseCase,
        _promoteCurrentAuthUserToDriverRoleWithRetryUseCase =
            promoteCurrentAuthUserToDriverRoleWithRetryUseCase,
        _resolveDriverEntryDestinationUseCase =
            resolveDriverEntryDestinationUseCase;

  final ReadUserRoleUseCase _readUserRoleUseCase;
  final PromoteCurrentAuthUserToDriverRoleWithRetryUseCase
      _promoteCurrentAuthUserToDriverRoleWithRetryUseCase;
  final ResolveDriverEntryDestinationUseCase
      _resolveDriverEntryDestinationUseCase;

  Future<EnsureCurrentAuthUserDriverRouteMutationReadinessResult> execute(
    EnsureCurrentAuthUserDriverRouteMutationReadinessCommand command,
  ) async {
    UserRole currentRole;
    try {
      currentRole = await _readUserRoleUseCase.execute(command.uid);
    } catch (_) {
      // Preserve route-mutation behavior: role read failure falls back to unknown,
      // then promotion is still attempted.
      currentRole = UserRole.unknown;
    }

    var effectiveRole = currentRole;
    if (!effectiveRole.isDriver) {
      final promotionResult =
          await _promoteCurrentAuthUserToDriverRoleWithRetryUseCase.execute(
        PromoteCurrentAuthUserToDriverRoleWithRetryCommand(
          displayName: command.displayName,
        ),
      );
      effectiveRole = promotionResult.role;
    }

    if (!effectiveRole.isDriver) {
      return EnsureCurrentAuthUserDriverRouteMutationReadinessResult(
        currentRole: currentRole,
        effectiveRole: effectiveRole,
        destination: null,
      );
    }

    final destination = await _resolveDriverEntryDestinationUseCase.execute(
      command.uid,
    );
    return EnsureCurrentAuthUserDriverRouteMutationReadinessResult(
      currentRole: currentRole,
      effectiveRole: effectiveRole,
      destination: destination,
    );
  }
}
