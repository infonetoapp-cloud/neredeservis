import '../../notifications/application/driver_push_token_registration_service.dart';
import '../data/auth_credential_gateway.dart';
import '../data/bootstrap_user_profile_client.dart';
import '../domain/user_role.dart';

class BootstrapCurrentAuthProfileSessionCommand {
  const BootstrapCurrentAuthProfileSessionCommand({
    required this.displayName,
    this.preferredRole,
  });

  final String displayName;
  final String? preferredRole;
}

class BootstrapCurrentAuthProfileSessionResult {
  const BootstrapCurrentAuthProfileSessionResult({
    required this.role,
  });

  final UserRole role;
}

class BootstrapCurrentAuthProfileSessionUseCase {
  BootstrapCurrentAuthProfileSessionUseCase({
    required AuthCredentialGateway authCredentialGateway,
    required BootstrapUserProfileClient bootstrapUserProfileClient,
    required DriverPushTokenRegistrationService driverPushTokenRegistrationService,
  }) : _authCredentialGateway = authCredentialGateway,
       _bootstrapUserProfileClient = bootstrapUserProfileClient,
       _driverPushTokenRegistrationService = driverPushTokenRegistrationService;

  final AuthCredentialGateway _authCredentialGateway;
  final BootstrapUserProfileClient _bootstrapUserProfileClient;
  final DriverPushTokenRegistrationService _driverPushTokenRegistrationService;

  Future<BootstrapCurrentAuthProfileSessionResult> execute(
    BootstrapCurrentAuthProfileSessionCommand command,
  ) async {
    final user = _authCredentialGateway.currentUser;
    if (user == null) {
      await _driverPushTokenRegistrationService.dispose();
      return const BootstrapCurrentAuthProfileSessionResult(
        role: UserRole.unknown,
      );
    }

    // Best-effort refresh to reduce stale role claims after account switches.
    try {
      await user.getIdToken(true);
    } catch (_) {
      // Callable bootstrap still proceeds with current auth context.
    }

    final bootstrapResult = await _bootstrapUserProfileClient.bootstrap(
      BootstrapUserProfileInput(
        displayName: command.displayName,
        preferredRole: command.preferredRole,
      ),
    );
    final role = bootstrapResult.role;
    if (role.isDriver) {
      try {
        await _driverPushTokenRegistrationService.registerForUid(user.uid);
      } catch (_) {
        // Non-blocking during bootstrap; app can continue without push registration.
      }
    } else {
      await _driverPushTokenRegistrationService.dispose();
    }

    return BootstrapCurrentAuthProfileSessionResult(role: role);
  }
}
