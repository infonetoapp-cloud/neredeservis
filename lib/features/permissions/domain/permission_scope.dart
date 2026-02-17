import '../../auth/domain/user_role.dart';

class PermissionScope {
  const PermissionScope({
    required this.canRequestNotification,
    required this.canRequestLocationWhileInUse,
    required this.canRequestLocationAlways,
    required this.canRequestBatteryOptimizationBypass,
  });

  final bool canRequestNotification;
  final bool canRequestLocationWhileInUse;
  final bool canRequestLocationAlways;
  final bool canRequestBatteryOptimizationBypass;

  factory PermissionScope.forRole(UserRole role) {
    if (role.isDriver) {
      return const PermissionScope(
        canRequestNotification: true,
        canRequestLocationWhileInUse: true,
        canRequestLocationAlways: true,
        canRequestBatteryOptimizationBypass: true,
      );
    }

    // Passenger + guest: location prompts are always blocked by policy.
    return const PermissionScope(
      canRequestNotification: true,
      canRequestLocationWhileInUse: false,
      canRequestLocationAlways: false,
      canRequestBatteryOptimizationBypass: false,
    );
  }
}
