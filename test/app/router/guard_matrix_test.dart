import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/app/router/app_route_paths.dart';
import 'package:neredeservis/app/router/auth_guard.dart';
import 'package:neredeservis/app/router/consent_guard.dart';
import 'package:neredeservis/app/router/role_guard.dart';
import 'package:neredeservis/features/auth/domain/user_role.dart';

void main() {
  group('guard matrix', () {
    test(
        'auth guard blocks private driver settings and paywall when signed out',
        () {
      const guard = AuthGuard(isSignedIn: false);

      expect(guard.redirect(AppRoutePath.driverSettings), AppRoutePath.auth);
      expect(guard.redirect(AppRoutePath.paywall), AppRoutePath.auth);
      expect(guard.redirect(AppRoutePath.settings), AppRoutePath.auth);
    });

    test(
        'role guard blocks passenger from driver corridor including driver settings',
        () {
      const guard = RoleGuard(currentRole: UserRole.passenger);

      expect(
          guard.redirect(AppRoutePath.driverHome), AppRoutePath.passengerHome);
      expect(
        guard.redirect(AppRoutePath.driverSettings),
        AppRoutePath.passengerHome,
      );
      expect(guard.redirect(AppRoutePath.paywall), AppRoutePath.passengerHome);
    });

    test(
        'role guard blocks driver from passenger corridor and allows driver settings',
        () {
      const guard = RoleGuard(currentRole: UserRole.driver);

      expect(
        guard.redirect(AppRoutePath.passengerTracking),
        AppRoutePath.driverHome,
      );
      expect(guard.redirect(AppRoutePath.passengerSettings),
          AppRoutePath.driverHome);
      expect(guard.redirect(AppRoutePath.driverSettings), isNull);
    });

    test('consent guard uses role-aware settings redirect target', () {
      const driverGuard = ConsentGuard(
        currentRole: UserRole.driver,
        hasLocationConsent: false,
      );
      const passengerGuard = ConsentGuard(
        currentRole: UserRole.passenger,
        hasLocationConsent: false,
      );

      expect(driverGuard.redirect(AppRoutePath.activeTrip),
          AppRoutePath.driverSettings);
      expect(passengerGuard.redirect(AppRoutePath.activeTrip),
          AppRoutePath.settings);
    });
  });
}
