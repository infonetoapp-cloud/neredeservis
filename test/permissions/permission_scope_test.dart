import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/auth/domain/user_role.dart';
import 'package:neredeservis/features/permissions/domain/permission_scope.dart';

void main() {
  group('PermissionScope.forRole', () {
    test('driver can request location and battery optimization bypass', () {
      final scope = PermissionScope.forRole(UserRole.driver);
      expect(scope.canRequestNotification, isTrue);
      expect(scope.canRequestLocationWhileInUse, isTrue);
      expect(scope.canRequestLocationAlways, isTrue);
      expect(scope.canRequestBatteryOptimizationBypass, isTrue);
    });

    test('passenger cannot request location permissions', () {
      final scope = PermissionScope.forRole(UserRole.passenger);
      expect(scope.canRequestNotification, isTrue);
      expect(scope.canRequestLocationWhileInUse, isFalse);
      expect(scope.canRequestLocationAlways, isFalse);
      expect(scope.canRequestBatteryOptimizationBypass, isFalse);
    });

    test('guest cannot request location permissions', () {
      final scope = PermissionScope.forRole(UserRole.guest);
      expect(scope.canRequestNotification, isTrue);
      expect(scope.canRequestLocationWhileInUse, isFalse);
      expect(scope.canRequestLocationAlways, isFalse);
      expect(scope.canRequestBatteryOptimizationBypass, isFalse);
    });
  });
}
