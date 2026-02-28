import '../../auth/application/ensure_current_auth_user_driver_role_with_retry_use_case.dart';
import '../../auth/domain/user_role.dart';
import 'resolve_driver_entry_destination_use_case.dart';

class EnsureCurrentAuthUserDriverCorridorEntryDestinationCommand {
  const EnsureCurrentAuthUserDriverCorridorEntryDestinationCommand({
    required this.uid,
    required this.displayName,
  });

  final String uid;
  final String displayName;
}

class EnsureCurrentAuthUserDriverCorridorEntryDestinationResult {
  const EnsureCurrentAuthUserDriverCorridorEntryDestinationResult({
    required this.currentRole,
    required this.effectiveRole,
    required this.destination,
  });

  final UserRole currentRole;
  final UserRole effectiveRole;
  final DriverEntryDestination? destination;
}

class EnsureCurrentAuthUserDriverCorridorEntryDestinationUseCase {
  const EnsureCurrentAuthUserDriverCorridorEntryDestinationUseCase({
    required EnsureCurrentAuthUserDriverRoleWithRetryUseCase
        ensureCurrentAuthUserDriverRoleWithRetryUseCase,
    required ResolveDriverEntryDestinationUseCase
        resolveDriverEntryDestinationUseCase,
  })  : _ensureCurrentAuthUserDriverRoleWithRetryUseCase =
            ensureCurrentAuthUserDriverRoleWithRetryUseCase,
        _resolveDriverEntryDestinationUseCase =
            resolveDriverEntryDestinationUseCase;

  final EnsureCurrentAuthUserDriverRoleWithRetryUseCase
      _ensureCurrentAuthUserDriverRoleWithRetryUseCase;
  final ResolveDriverEntryDestinationUseCase
      _resolveDriverEntryDestinationUseCase;

  Future<EnsureCurrentAuthUserDriverCorridorEntryDestinationResult> execute(
    EnsureCurrentAuthUserDriverCorridorEntryDestinationCommand command,
  ) async {
    final roleReadiness =
        await _ensureCurrentAuthUserDriverRoleWithRetryUseCase.execute(
      EnsureCurrentAuthUserDriverRoleWithRetryCommand(
        uid: command.uid,
        displayName: command.displayName,
      ),
    );

    if (!roleReadiness.effectiveRole.isDriver) {
      return EnsureCurrentAuthUserDriverCorridorEntryDestinationResult(
        currentRole: roleReadiness.currentRole,
        effectiveRole: roleReadiness.effectiveRole,
        destination: null,
      );
    }

    final destination = await _resolveDriverEntryDestinationUseCase.execute(
      command.uid,
    );
    return EnsureCurrentAuthUserDriverCorridorEntryDestinationResult(
      currentRole: roleReadiness.currentRole,
      effectiveRole: roleReadiness.effectiveRole,
      destination: destination,
    );
  }
}
