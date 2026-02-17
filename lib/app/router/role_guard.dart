import '../../features/auth/domain/user_role.dart';
import 'app_route_paths.dart';

class RoleGuard {
  const RoleGuard({
    required this.currentRole,
  });

  final UserRole currentRole;

  String? redirect(String location) {
    if (location.startsWith('/driver/') && currentRole != UserRole.driver) {
      return AppRoutePath.passengerHome;
    }

    if (location.startsWith('/passenger/') && currentRole == UserRole.driver) {
      return AppRoutePath.driverHome;
    }

    return null;
  }
}
