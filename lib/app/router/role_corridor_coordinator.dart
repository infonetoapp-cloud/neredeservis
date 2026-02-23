import '../../features/auth/domain/user_role.dart';
import 'app_route_paths.dart';

enum RouteCorridor {
  publicShared,
  driver,
  passenger,
}

class RoleSwitchNavigationPlan {
  const RoleSwitchNavigationPlan({
    required this.targetLocation,
    required this.resetStack,
    required this.bootstrapRoleContext,
  });

  final String targetLocation;
  final bool resetStack;
  final bool bootstrapRoleContext;
}

/// Centralizes corridor decisions so router guards and future shells use one rule set.
class RoleCorridorCoordinator {
  const RoleCorridorCoordinator();

  RouteCorridor classify(String location) {
    if (location.startsWith('/driver/')) {
      return RouteCorridor.driver;
    }
    if (location.startsWith('/passenger/')) {
      return RouteCorridor.passenger;
    }
    return RouteCorridor.publicShared;
  }

  String? redirectForCurrentRole({
    required UserRole currentRole,
    required String location,
  }) {
    if (currentRole == UserRole.unknown) {
      return null;
    }

    if (location == AppRoutePath.join && currentRole == UserRole.driver) {
      return AppRoutePath.driverHome;
    }

    final corridor = classify(location);
    if (corridor == RouteCorridor.driver && currentRole != UserRole.driver) {
      return AppRoutePath.passengerHome;
    }

    if (corridor == RouteCorridor.passenger && currentRole == UserRole.driver) {
      return AppRoutePath.driverHome;
    }

    return null;
  }

  RoleSwitchNavigationPlan planRoleSwitchTransaction({
    required UserRole fromRole,
    required UserRole toRole,
    required String currentLocation,
  }) {
    if (fromRole == toRole) {
      return RoleSwitchNavigationPlan(
        targetLocation: currentLocation,
        resetStack: false,
        bootstrapRoleContext: false,
      );
    }

    final target = homePathForRole(toRole);
    return RoleSwitchNavigationPlan(
      targetLocation: target,
      resetStack: true,
      bootstrapRoleContext: toRole != UserRole.unknown,
    );
  }

  /// Uses an explicit destination while preserving role-switch semantics
  /// (reset/bootstrap) in one place.
  RoleSwitchNavigationPlan planRoleSwitchToDestination({
    required UserRole fromRole,
    required UserRole toRole,
    required String currentLocation,
    required String targetLocation,
  }) {
    final basePlan = planRoleSwitchTransaction(
      fromRole: fromRole,
      toRole: toRole,
      currentLocation: currentLocation,
    );
    return RoleSwitchNavigationPlan(
      targetLocation: targetLocation,
      resetStack: basePlan.resetStack,
      bootstrapRoleContext: basePlan.bootstrapRoleContext,
    );
  }

  String homePathForRole(UserRole role) {
    switch (role) {
      case UserRole.driver:
        return AppRoutePath.driverHome;
      case UserRole.passenger:
        return AppRoutePath.passengerHome;
      case UserRole.guest:
        return AppRoutePath.join;
      case UserRole.unknown:
        return AppRoutePath.roleSelect;
    }
  }
}
