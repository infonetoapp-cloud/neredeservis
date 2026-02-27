import '../../auth/application/read_user_role_use_case.dart';
import '../../auth/domain/user_role.dart';
import 'location_permission_gate.dart';

class ShouldPromptLocationPermissionForUserCommand {
  const ShouldPromptLocationPermissionForUserCommand({
    required this.uid,
    required this.trigger,
  });

  final String uid;
  final LocationPermissionPromptTrigger trigger;
}

class ShouldPromptLocationPermissionForUserResult {
  const ShouldPromptLocationPermissionForUserResult({
    required this.role,
    required this.shouldPrompt,
  });

  final UserRole role;
  final bool shouldPrompt;
}

class ShouldPromptLocationPermissionForUserUseCase {
  const ShouldPromptLocationPermissionForUserUseCase({
    required ReadUserRoleUseCase readUserRoleUseCase,
    required LocationPermissionGate locationPermissionGate,
  })  : _readUserRoleUseCase = readUserRoleUseCase,
        _locationPermissionGate = locationPermissionGate;

  final ReadUserRoleUseCase _readUserRoleUseCase;
  final LocationPermissionGate _locationPermissionGate;

  Future<ShouldPromptLocationPermissionForUserResult> execute(
    ShouldPromptLocationPermissionForUserCommand command,
  ) async {
    final role = await _readUserRoleUseCase.execute(command.uid);
    final shouldPrompt = _locationPermissionGate.shouldPromptLocationPermission(
      role: role,
      trigger: command.trigger,
    );
    return ShouldPromptLocationPermissionForUserResult(
      role: role,
      shouldPrompt: shouldPrompt,
    );
  }
}
