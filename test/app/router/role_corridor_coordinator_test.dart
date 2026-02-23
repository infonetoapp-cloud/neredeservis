import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/app/router/app_route_paths.dart';
import 'package:neredeservis/app/router/role_corridor_coordinator.dart';
import 'package:neredeservis/features/auth/domain/user_role.dart';

void main() {
  const coordinator = RoleCorridorCoordinator();

  group('classify', () {
    test('classifies driver corridor', () {
      expect(
        coordinator.classify(AppRoutePath.driverRouteCreate),
        RouteCorridor.driver,
      );
    });

    test('classifies passenger corridor', () {
      expect(
        coordinator.classify(AppRoutePath.passengerTracking),
        RouteCorridor.passenger,
      );
    });

    test('classifies public/shared routes', () {
      expect(
          coordinator.classify(AppRoutePath.join), RouteCorridor.publicShared);
      expect(
        coordinator.classify(AppRoutePath.settings),
        RouteCorridor.publicShared,
      );
    });
  });

  group('redirectForCurrentRole', () {
    test('matches driver join redirect rule', () {
      expect(
        coordinator.redirectForCurrentRole(
          currentRole: UserRole.driver,
          location: AppRoutePath.join,
        ),
        AppRoutePath.driverHome,
      );
    });

    test('keeps unknown role untouched', () {
      expect(
        coordinator.redirectForCurrentRole(
          currentRole: UserRole.unknown,
          location: AppRoutePath.driverHome,
        ),
        isNull,
      );
    });

    test('redirects passenger away from driver corridor', () {
      expect(
        coordinator.redirectForCurrentRole(
          currentRole: UserRole.passenger,
          location: AppRoutePath.driverHome,
        ),
        AppRoutePath.passengerHome,
      );
    });

    test('redirects driver away from passenger corridor', () {
      expect(
        coordinator.redirectForCurrentRole(
          currentRole: UserRole.driver,
          location: AppRoutePath.passengerHome,
        ),
        AppRoutePath.driverHome,
      );
    });
  });

  group('planRoleSwitchTransaction', () {
    test('same role keeps location and avoids reset', () {
      final plan = coordinator.planRoleSwitchTransaction(
        fromRole: UserRole.passenger,
        toRole: UserRole.passenger,
        currentLocation: AppRoutePath.passengerTracking,
      );

      expect(plan.targetLocation, AppRoutePath.passengerTracking);
      expect(plan.resetStack, isFalse);
      expect(plan.bootstrapRoleContext, isFalse);
    });

    test('driver switch resets stack and targets driver home', () {
      final plan = coordinator.planRoleSwitchTransaction(
        fromRole: UserRole.passenger,
        toRole: UserRole.driver,
        currentLocation: AppRoutePath.passengerTracking,
      );

      expect(plan.targetLocation, AppRoutePath.driverHome);
      expect(plan.resetStack, isTrue);
      expect(plan.bootstrapRoleContext, isTrue);
    });

    test('unknown switch targets role select without bootstrap', () {
      final plan = coordinator.planRoleSwitchTransaction(
        fromRole: UserRole.driver,
        toRole: UserRole.unknown,
        currentLocation: AppRoutePath.driverHome,
      );

      expect(plan.targetLocation, AppRoutePath.roleSelect);
      expect(plan.resetStack, isTrue);
      expect(plan.bootstrapRoleContext, isFalse);
    });

    test('guest switch targets join route', () {
      final plan = coordinator.planRoleSwitchTransaction(
        fromRole: UserRole.passenger,
        toRole: UserRole.guest,
        currentLocation: AppRoutePath.passengerHome,
      );

      expect(plan.targetLocation, AppRoutePath.join);
      expect(plan.resetStack, isTrue);
      expect(plan.bootstrapRoleContext, isTrue);
    });
  });

  group('planRoleSwitchToDestination', () {
    test('preserves same-role no-reset semantics while using explicit target',
        () {
      final plan = coordinator.planRoleSwitchToDestination(
        fromRole: UserRole.passenger,
        toRole: UserRole.passenger,
        currentLocation: AppRoutePath.roleSelect,
        targetLocation: AppRoutePath.passengerTracking,
      );

      expect(plan.targetLocation, AppRoutePath.passengerTracking);
      expect(plan.resetStack, isFalse);
      expect(plan.bootstrapRoleContext, isFalse);
    });

    test('preserves switch reset/bootstrap semantics with explicit target', () {
      final plan = coordinator.planRoleSwitchToDestination(
        fromRole: UserRole.driver,
        toRole: UserRole.passenger,
        currentLocation: AppRoutePath.driverHome,
        targetLocation: AppRoutePath.passengerTracking,
      );

      expect(plan.targetLocation, AppRoutePath.passengerTracking);
      expect(plan.resetStack, isTrue);
      expect(plan.bootstrapRoleContext, isTrue);
    });
  });
}
