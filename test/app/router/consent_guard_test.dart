import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/app/router/app_route_paths.dart';
import 'package:neredeservis/app/router/consent_guard.dart';
import 'package:neredeservis/features/auth/domain/user_role.dart';

void main() {
  test('passenger tracking path is exempt from forced settings redirect', () {
    const guard = ConsentGuard(
      currentRole: UserRole.passenger,
      hasLocationConsent: false,
    );

    expect(guard.redirect(AppRoutePath.passengerTracking), isNull);
  });

  test('passenger non-required path is soft-gated without consent', () {
    const guard = ConsentGuard(
      currentRole: UserRole.passenger,
      hasLocationConsent: false,
    );

    expect(guard.redirect('/passenger/custom'), isNull);
  });

  test('join qr path is exempt from forced settings redirect', () {
    const guard = ConsentGuard(
      currentRole: UserRole.passenger,
      hasLocationConsent: false,
    );

    expect(guard.redirect(AppRoutePath.joinQr), isNull);
  });

  test('driver active trip redirects to driver settings without consent', () {
    const guard = ConsentGuard(
      currentRole: UserRole.driver,
      hasLocationConsent: false,
    );

    expect(
        guard.redirect(AppRoutePath.activeTrip), AppRoutePath.driverSettings);
  });

  test('driver settings path is exempt from forced consent redirect', () {
    const guard = ConsentGuard(
      currentRole: UserRole.driver,
      hasLocationConsent: false,
    );

    expect(guard.redirect(AppRoutePath.driverSettings), isNull);
  });
}
