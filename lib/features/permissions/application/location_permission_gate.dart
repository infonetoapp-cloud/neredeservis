import '../../auth/domain/user_role.dart';
import '../domain/permission_scope.dart';

enum LocationPermissionPromptTrigger {
  driverHomeEntry,
  startTrip,
  ghostDriveRecording,
}

class LocationPermissionGate {
  const LocationPermissionGate();

  bool shouldPromptLocationPermission({
    required UserRole role,
    required LocationPermissionPromptTrigger trigger,
  }) {
    final scope = PermissionScope.forRole(role);
    if (!scope.canRequestLocationWhileInUse) {
      return false;
    }
    return switch (trigger) {
      LocationPermissionPromptTrigger.driverHomeEntry => true,
      LocationPermissionPromptTrigger.startTrip => true,
      LocationPermissionPromptTrigger.ghostDriveRecording => true,
    };
  }
}
