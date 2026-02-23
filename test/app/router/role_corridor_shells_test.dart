import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/app/router/app_route_paths.dart';
import 'package:neredeservis/app/router/role_corridor_coordinator.dart';
import 'package:neredeservis/app/router/role_corridor_shells.dart';
import 'package:neredeservis/features/auth/domain/user_role.dart';

void main() {
  group('RoleCorridorShellTransitionBus', () {
    test('publishes driver corridor transitions to driver shell channel', () {
      final bus = RoleCorridorShellTransitionBus();

      bus.publish(
        fromRole: UserRole.passenger,
        toRole: UserRole.driver,
        currentLocation: AppRoutePath.passengerHome,
        plan: const RoleSwitchNavigationPlan(
          targetLocation: AppRoutePath.driverHome,
          resetStack: true,
          bootstrapRoleContext: true,
        ),
      );

      final driverEvent = bus.driverEvents().value;
      final passengerEvent = bus.passengerEvents().value;
      expect(driverEvent, isNotNull);
      expect(driverEvent!.toRole, UserRole.driver);
      expect(driverEvent.plan.targetLocation, AppRoutePath.driverHome);
      expect(passengerEvent, isNull);
    });

    test('publishes passenger corridor transitions to passenger shell channel',
        () {
      final bus = RoleCorridorShellTransitionBus();

      bus.publish(
        fromRole: UserRole.driver,
        toRole: UserRole.passenger,
        currentLocation: AppRoutePath.driverHome,
        plan: const RoleSwitchNavigationPlan(
          targetLocation: AppRoutePath.passengerTracking,
          resetStack: true,
          bootstrapRoleContext: true,
        ),
      );

      final driverEvent = bus.driverEvents().value;
      final passengerEvent = bus.passengerEvents().value;
      expect(driverEvent, isNull);
      expect(passengerEvent, isNotNull);
      expect(passengerEvent!.toRole, UserRole.passenger);
      expect(
          passengerEvent.plan.targetLocation, AppRoutePath.passengerTracking);
    });

    test('ignores public/shared targets', () {
      final bus = RoleCorridorShellTransitionBus();

      bus.publish(
        fromRole: UserRole.passenger,
        toRole: UserRole.unknown,
        currentLocation: AppRoutePath.passengerHome,
        plan: const RoleSwitchNavigationPlan(
          targetLocation: AppRoutePath.roleSelect,
          resetStack: true,
          bootstrapRoleContext: false,
        ),
      );

      expect(bus.driverEvents().value, isNull);
      expect(bus.passengerEvents().value, isNull);
    });
  });

  group('RoleCorridorShellRuntimeStore', () {
    test('records driver transition counts and plan flags', () {
      final store = RoleCorridorShellRuntimeStore();

      store.recordDriverTransition(
        const RoleCorridorShellTransitionEvent(
          sequence: 7,
          fromRole: UserRole.passenger,
          toRole: UserRole.driver,
          currentLocation: AppRoutePath.passengerHome,
          plan: RoleSwitchNavigationPlan(
            targetLocation: AppRoutePath.driverHome,
            resetStack: true,
            bootstrapRoleContext: true,
          ),
        ),
      );

      final snapshot = store.driver().value;
      expect(snapshot.lastSequence, 7);
      expect(snapshot.lastFromRole, UserRole.passenger);
      expect(snapshot.lastToRole, UserRole.driver);
      expect(snapshot.lastCurrentLocation, AppRoutePath.passengerHome);
      expect(snapshot.lastTargetLocation, AppRoutePath.driverHome);
      expect(snapshot.lastResetStackRequest, isTrue);
      expect(snapshot.lastBootstrapRequest, isTrue);
      expect(snapshot.transitionCount, 1);
      expect(snapshot.resetRequestCount, 1);
      expect(snapshot.bootstrapRequestCount, 1);
      expect(snapshot.recentTransitionTrace, hasLength(1));
      expect(
          snapshot.recentTransitionTrace.single, contains('passenger->driver'));
      expect(snapshot.recentTransitionTrace.single,
          contains(AppRoutePath.driverHome));
      expect(store.passenger().value.transitionCount, 0);
    });

    test('accumulates counts across multiple passenger transitions', () {
      final store = RoleCorridorShellRuntimeStore();

      store.recordPassengerTransition(
        const RoleCorridorShellTransitionEvent(
          sequence: 1,
          fromRole: UserRole.unknown,
          toRole: UserRole.passenger,
          currentLocation: AppRoutePath.roleSelect,
          plan: RoleSwitchNavigationPlan(
            targetLocation: AppRoutePath.passengerHome,
            resetStack: true,
            bootstrapRoleContext: true,
          ),
        ),
      );
      store.recordPassengerTransition(
        const RoleCorridorShellTransitionEvent(
          sequence: 2,
          fromRole: UserRole.passenger,
          toRole: UserRole.passenger,
          currentLocation: AppRoutePath.passengerHome,
          plan: RoleSwitchNavigationPlan(
            targetLocation: AppRoutePath.passengerTracking,
            resetStack: false,
            bootstrapRoleContext: false,
          ),
        ),
      );

      final snapshot = store.passenger().value;
      expect(snapshot.lastSequence, 2);
      expect(snapshot.lastTargetLocation, AppRoutePath.passengerTracking);
      expect(snapshot.transitionCount, 2);
      expect(snapshot.resetRequestCount, 1);
      expect(snapshot.bootstrapRequestCount, 1);
      expect(snapshot.lastResetStackRequest, isFalse);
      expect(snapshot.lastBootstrapRequest, isFalse);
      expect(snapshot.recentTransitionTrace, hasLength(2));
      expect(snapshot.recentTransitionTrace.last, contains('#2'));
      expect(snapshot.recentTransitionTrace.last,
          contains(AppRoutePath.passengerTracking));
    });
  });
}
