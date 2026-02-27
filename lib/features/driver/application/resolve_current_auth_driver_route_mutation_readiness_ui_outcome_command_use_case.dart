import '../../auth/application/resolve_auth_user_display_name_use_case.dart';
import '../../auth/data/auth_credential_gateway.dart';
import '../../auth/domain/user_role.dart';
import 'ensure_current_auth_user_driver_route_mutation_readiness_use_case.dart';
import 'plan_driver_route_mutation_readiness_ui_outcome_use_case.dart';
import 'resolve_driver_entry_destination_use_case.dart';

class ResolveCurrentAuthDriverRouteMutationReadinessUiOutcomeCommandUseCase {
  const ResolveCurrentAuthDriverRouteMutationReadinessUiOutcomeCommandUseCase({
    required AuthCredentialGateway authCredentialGateway,
    required ResolveAuthUserDisplayNameUseCase
        resolveAuthUserDisplayNameUseCase,
    required EnsureCurrentAuthUserDriverRouteMutationReadinessUseCase
        ensureCurrentAuthUserDriverRouteMutationReadinessUseCase,
  })  : _authCredentialGateway = authCredentialGateway,
        _resolveAuthUserDisplayNameUseCase = resolveAuthUserDisplayNameUseCase,
        _ensureCurrentAuthUserDriverRouteMutationReadinessUseCase =
            ensureCurrentAuthUserDriverRouteMutationReadinessUseCase;

  final AuthCredentialGateway _authCredentialGateway;
  final ResolveAuthUserDisplayNameUseCase _resolveAuthUserDisplayNameUseCase;
  final EnsureCurrentAuthUserDriverRouteMutationReadinessUseCase
      _ensureCurrentAuthUserDriverRouteMutationReadinessUseCase;

  Future<PlanDriverRouteMutationReadinessUiOutcomeCommand> execute() async {
    final user = _authCredentialGateway.currentUser;
    if (user == null || user.isAnonymous) {
      return const PlanDriverRouteMutationReadinessUiOutcomeCommand
          .unauthenticated();
    }

    try {
      final readiness =
          await _ensureCurrentAuthUserDriverRouteMutationReadinessUseCase
              .execute(
        EnsureCurrentAuthUserDriverRouteMutationReadinessCommand(
          uid: user.uid,
          displayName: _resolveAuthUserDisplayNameUseCase.execute(
            ResolveAuthUserDisplayNameCommand(
              displayName: user.displayName,
              email: user.email,
              isAnonymous: user.isAnonymous,
            ),
          ),
        ),
      );

      if (!readiness.effectiveRole.isDriver) {
        return const PlanDriverRouteMutationReadinessUiOutcomeCommand
            .driverRoleRequired();
      }

      if (readiness.destination != DriverEntryDestination.home) {
        return const PlanDriverRouteMutationReadinessUiOutcomeCommand
            .driverProfileSetupRequired();
      }

      return const PlanDriverRouteMutationReadinessUiOutcomeCommand.allow();
    } catch (_) {
      return const PlanDriverRouteMutationReadinessUiOutcomeCommand
          .profileCheckFailed();
    }
  }
}
