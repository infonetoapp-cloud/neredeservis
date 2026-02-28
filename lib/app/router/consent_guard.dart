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
    AppRoutePath.forceUpdate,
    AppRoutePath.roleSelect,
    AppRoutePath.join,
    AppRoutePath.driverSettings,
    AppRoutePath.settings,
    AppRoutePath.profileEdit,
    AppRoutePath.driverProfileSetup,
  };

  static const Set<String> _consentRequiredRoutes = <String>{
    AppRoutePath.activeTrip,
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

    // Do not block general app navigation (home, routes, settings entry) on startup.
    // We only hard-gate screens that cannot function without local device location.
    if (!_consentRequiredRoutes.contains(location)) {
      return null;
    }

    if (currentRole == UserRole.driver) {
      return AppRoutePath.driverSettings;
    }
    return AppRoutePath.settings;
  }
}
