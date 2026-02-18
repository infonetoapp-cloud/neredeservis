import '../../features/auth/domain/user_role.dart';
import 'app_route_paths.dart';

class ConsentGuard {
  const ConsentGuard({
    required this.currentRole,
    required this.hasLocationConsent,
  });

  final UserRole currentRole;
  final bool hasLocationConsent;

  static const Set<String> _consentExemptRoutes = <String>{
    AppRoutePath.splash,
    AppRoutePath.auth,
    AppRoutePath.roleSelect,
    AppRoutePath.join,
    AppRoutePath.settings,
    AppRoutePath.profileEdit,
    AppRoutePath.driverProfileSetup,
  };

  String? redirect(String location) {
    if (currentRole == UserRole.unknown || currentRole == UserRole.guest) {
      return null;
    }

    if (hasLocationConsent) {
      return null;
    }

    if (_consentExemptRoutes.contains(location)) {
      return null;
    }

    return AppRoutePath.settings;
  }
}
