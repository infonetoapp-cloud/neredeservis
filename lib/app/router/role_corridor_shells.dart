import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';

import '../../features/auth/domain/user_role.dart';
import 'role_corridor_coordinator.dart';

@immutable
class RoleCorridorShellTransitionEvent {
  const RoleCorridorShellTransitionEvent({
    required this.sequence,
    required this.fromRole,
    required this.toRole,
    required this.currentLocation,
    required this.plan,
  });

  final int sequence;
  final UserRole fromRole;
  final UserRole toRole;
  final String currentLocation;
  final RoleSwitchNavigationPlan plan;
}

/// Shell-scoped transition bus for gradual corridor transaction activation.
class RoleCorridorShellTransitionBus {
  RoleCorridorShellTransitionBus({
    RoleCorridorCoordinator? coordinator,
  }) : _coordinator = coordinator ?? const RoleCorridorCoordinator();

  final RoleCorridorCoordinator _coordinator;
  final ValueNotifier<RoleCorridorShellTransitionEvent?> _driverEvents =
      ValueNotifier<RoleCorridorShellTransitionEvent?>(null);
  final ValueNotifier<RoleCorridorShellTransitionEvent?> _passengerEvents =
      ValueNotifier<RoleCorridorShellTransitionEvent?>(null);

  var _sequence = 0;

  ValueListenable<RoleCorridorShellTransitionEvent?> driverEvents() =>
      _driverEvents;
  ValueListenable<RoleCorridorShellTransitionEvent?> passengerEvents() =>
      _passengerEvents;

  void publish({
    required UserRole fromRole,
    required UserRole toRole,
    required String currentLocation,
    required RoleSwitchNavigationPlan plan,
  }) {
    final corridor = _coordinator.classify(plan.targetLocation);
    if (corridor == RouteCorridor.publicShared) {
      return;
    }
    final event = RoleCorridorShellTransitionEvent(
      sequence: ++_sequence,
      fromRole: fromRole,
      toRole: toRole,
      currentLocation: currentLocation,
      plan: plan,
    );
    switch (corridor) {
      case RouteCorridor.driver:
        _driverEvents.value = event;
        return;
      case RouteCorridor.passenger:
        _passengerEvents.value = event;
        return;
      case RouteCorridor.publicShared:
        return;
    }
  }

  @visibleForTesting
  void clear() {
    _driverEvents.value = null;
    _passengerEvents.value = null;
    _sequence = 0;
  }
}

final RoleCorridorShellTransitionBus roleCorridorShellTransitionBus =
    RoleCorridorShellTransitionBus();

@immutable
class RoleCorridorShellRuntimeSnapshot {
  const RoleCorridorShellRuntimeSnapshot({
    this.lastSequence,
    this.lastFromRole = UserRole.unknown,
    this.lastToRole = UserRole.unknown,
    this.lastCurrentLocation,
    this.lastTargetLocation,
    this.lastResetStackRequest = false,
    this.lastBootstrapRequest = false,
    this.transitionCount = 0,
    this.resetRequestCount = 0,
    this.bootstrapRequestCount = 0,
    this.recentTransitionTrace = const <String>[],
  });

  final int? lastSequence;
  final UserRole lastFromRole;
  final UserRole lastToRole;
  final String? lastCurrentLocation;
  final String? lastTargetLocation;
  final bool lastResetStackRequest;
  final bool lastBootstrapRequest;
  final int transitionCount;
  final int resetRequestCount;
  final int bootstrapRequestCount;
  final List<String> recentTransitionTrace;

  RoleCorridorShellRuntimeSnapshot applyTransition(
    RoleCorridorShellTransitionEvent event,
  ) {
    const maxTraceEntries = 12;
    final traceLine = '#${event.sequence} '
        '${event.fromRole.name}->${event.toRole.name} '
        '${event.currentLocation} => ${event.plan.targetLocation} '
        '(reset=${event.plan.resetStack}, bootstrap=${event.plan.bootstrapRoleContext})';
    final nextTrace = <String>[...recentTransitionTrace, traceLine];
    final boundedTrace = nextTrace.length <= maxTraceEntries
        ? nextTrace
        : nextTrace.sublist(nextTrace.length - maxTraceEntries);
    return RoleCorridorShellRuntimeSnapshot(
      lastSequence: event.sequence,
      lastFromRole: event.fromRole,
      lastToRole: event.toRole,
      lastCurrentLocation: event.currentLocation,
      lastTargetLocation: event.plan.targetLocation,
      lastResetStackRequest: event.plan.resetStack,
      lastBootstrapRequest: event.plan.bootstrapRoleContext,
      transitionCount: transitionCount + 1,
      resetRequestCount: resetRequestCount + (event.plan.resetStack ? 1 : 0),
      bootstrapRequestCount:
          bootstrapRequestCount + (event.plan.bootstrapRoleContext ? 1 : 0),
      recentTransitionTrace: List<String>.unmodifiable(boundedTrace),
    );
  }
}

/// Stores shell-level transition metadata without changing navigation behavior.
class RoleCorridorShellRuntimeStore {
  final ValueNotifier<RoleCorridorShellRuntimeSnapshot> _driver =
      ValueNotifier<RoleCorridorShellRuntimeSnapshot>(
    const RoleCorridorShellRuntimeSnapshot(),
  );
  final ValueNotifier<RoleCorridorShellRuntimeSnapshot> _passenger =
      ValueNotifier<RoleCorridorShellRuntimeSnapshot>(
    const RoleCorridorShellRuntimeSnapshot(),
  );

  ValueListenable<RoleCorridorShellRuntimeSnapshot> driver() => _driver;
  ValueListenable<RoleCorridorShellRuntimeSnapshot> passenger() => _passenger;

  void recordDriverTransition(RoleCorridorShellTransitionEvent event) {
    _driver.value = _driver.value.applyTransition(event);
  }

  void recordPassengerTransition(RoleCorridorShellTransitionEvent event) {
    _passenger.value = _passenger.value.applyTransition(event);
  }

  @visibleForTesting
  void clear() {
    _driver.value = const RoleCorridorShellRuntimeSnapshot();
    _passenger.value = const RoleCorridorShellRuntimeSnapshot();
  }
}

final RoleCorridorShellRuntimeStore roleCorridorShellRuntimeStore =
    RoleCorridorShellRuntimeStore();

/// No-op shells for gradual corridor migration.
/// They already subscribe to role-switch metadata so reset/bootstrap behavior
/// can be activated later without changing route paths.
class DriverShell extends StatefulWidget {
  const DriverShell({super.key, required this.child});

  final Widget child;

  @override
  State<DriverShell> createState() => _DriverShellState();
}

class _DriverShellState extends State<DriverShell> {
  int? _lastHandledSequence;

  @override
  void initState() {
    super.initState();
    roleCorridorShellTransitionBus.driverEvents().addListener(
          _handleTransitionEvent,
        );
    _handleTransitionEvent();
  }

  @override
  void dispose() {
    roleCorridorShellTransitionBus.driverEvents().removeListener(
          _handleTransitionEvent,
        );
    super.dispose();
  }

  void _handleTransitionEvent() {
    final event = roleCorridorShellTransitionBus.driverEvents().value;
    if (event == null || _lastHandledSequence == event.sequence) {
      return;
    }
    _lastHandledSequence = event.sequence;
    _onRoleSwitchTransition(event);
  }

  void _onRoleSwitchTransition(RoleCorridorShellTransitionEvent event) {
    if (event.plan.resetStack) {
      _triggerResetStackRequest(event);
    }
    if (event.plan.bootstrapRoleContext) {
      _triggerBootstrapRoleContextRequest(event);
    }
    roleCorridorShellRuntimeStore.recordDriverTransition(event);
  }

  void _triggerResetStackRequest(RoleCorridorShellTransitionEvent event) {
    // Placeholder for future driver shell stack-reset orchestration.
  }

  void _triggerBootstrapRoleContextRequest(
    RoleCorridorShellTransitionEvent event,
  ) {
    // Placeholder for future driver corridor bootstrap orchestration.
  }

  @override
  Widget build(BuildContext context) => widget.child;
}

class PassengerShell extends StatefulWidget {
  const PassengerShell({super.key, required this.child});

  final Widget child;

  @override
  State<PassengerShell> createState() => _PassengerShellState();
}

class _PassengerShellState extends State<PassengerShell> {
  int? _lastHandledSequence;

  @override
  void initState() {
    super.initState();
    roleCorridorShellTransitionBus.passengerEvents().addListener(
          _handleTransitionEvent,
        );
    _handleTransitionEvent();
  }

  @override
  void dispose() {
    roleCorridorShellTransitionBus.passengerEvents().removeListener(
          _handleTransitionEvent,
        );
    super.dispose();
  }

  void _handleTransitionEvent() {
    final event = roleCorridorShellTransitionBus.passengerEvents().value;
    if (event == null || _lastHandledSequence == event.sequence) {
      return;
    }
    _lastHandledSequence = event.sequence;
    _onRoleSwitchTransition(event);
  }

  void _onRoleSwitchTransition(RoleCorridorShellTransitionEvent event) {
    if (event.plan.resetStack) {
      _triggerResetStackRequest(event);
    }
    if (event.plan.bootstrapRoleContext) {
      _triggerBootstrapRoleContextRequest(event);
    }
    roleCorridorShellRuntimeStore.recordPassengerTransition(event);
  }

  void _triggerResetStackRequest(RoleCorridorShellTransitionEvent event) {
    // Placeholder for future passenger shell stack-reset orchestration.
  }

  void _triggerBootstrapRoleContextRequest(
    RoleCorridorShellTransitionEvent event,
  ) {
    // Placeholder for future passenger corridor bootstrap orchestration.
  }

  @override
  Widget build(BuildContext context) => widget.child;
}
