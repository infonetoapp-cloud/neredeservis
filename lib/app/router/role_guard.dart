import '../../features/auth/domain/user_role.dart';
import 'role_corridor_coordinator.dart';

class RoleGuard {
  const RoleGuard({
    required this.currentRole,
    RoleCorridorCoordinator? coordinator,
  }) : _coordinator = coordinator ?? const RoleCorridorCoordinator();

  final UserRole currentRole;
  final RoleCorridorCoordinator _coordinator;

  String? redirect(String location) {
    return _coordinator.redirectForCurrentRole(
      currentRole: currentRole,
      location: location,
    );
  }
}
