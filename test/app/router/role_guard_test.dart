import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/app/router/app_route_paths.dart';
import 'package:neredeservis/app/router/role_guard.dart';
import 'package:neredeservis/features/auth/domain/user_role.dart';

void main() {
  test('unknown role does not redirect', () {
    const guard = RoleGuard(currentRole: UserRole.unknown);
    expect(guard.redirect(AppRoutePath.roleSelect), isNull);
  });

  test('non-driver role cannot access driver paths', () {
    const guard = RoleGuard(currentRole: UserRole.passenger);
    expect(guard.redirect(AppRoutePath.driverHome), AppRoutePath.passengerHome);
  });

  test('driver role is redirected away from passenger corridor paths', () {
    const guard = RoleGuard(currentRole: UserRole.driver);
    expect(guard.redirect(AppRoutePath.passengerHome), AppRoutePath.driverHome);
  });

  test('driver role is redirected away from join screen', () {
    const guard = RoleGuard(currentRole: UserRole.driver);
    expect(guard.redirect(AppRoutePath.join), AppRoutePath.driverHome);
  });

  test('passenger role can stay on join screen', () {
    const guard = RoleGuard(currentRole: UserRole.passenger);
    expect(guard.redirect(AppRoutePath.join), isNull);
  });
}
