part of '../app_router.dart';

class _PassengerTrackingRouteQuery {
  const _PassengerTrackingRouteQuery({
    required this.routeId,
    required this.routeName,
    required this.etaSourceLabel,
    required this.guestSessionId,
    required this.guestExpiresAt,
  });

  final String? routeId;
  final String? routeName;
  final String? etaSourceLabel;
  final String? guestSessionId;
  final String? guestExpiresAt;

  factory _PassengerTrackingRouteQuery.fromState(GoRouterState state) {
    final query = state.uri.queryParameters;
    return _PassengerTrackingRouteQuery(
      routeId: _nullableParam(query['routeId']),
      routeName: _nullableParam(query['routeName']),
      etaSourceLabel: _nullableParam(query['etaSourceLabel']),
      guestSessionId: _nullableParam(query['guestSessionId']),
      guestExpiresAt: _nullableParam(query['guestExpiresAt']),
    );
  }
}

class _TripChatRouteQuery {
  const _TripChatRouteQuery({
    required this.routeId,
    required this.conversationId,
    required this.counterpartName,
    required this.counterpartSubtitle,
  });

  final String? routeId;
  final String? conversationId;
  final String counterpartName;
  final String? counterpartSubtitle;

  bool get hasRequiredIds => routeId != null && conversationId != null;

  factory _TripChatRouteQuery.fromState(GoRouterState state) {
    final query = state.uri.queryParameters;
    return _TripChatRouteQuery(
      routeId: _nullableParam(query['routeId']),
      conversationId: _nullableParam(query['conversationId']),
      counterpartName: _nullableParam(query['counterpartName']) ?? 'Sohbet',
      counterpartSubtitle: _nullableParam(query['counterpartSubtitle']),
    );
  }
}

class _PassengerSettingsRouteQuery {
  const _PassengerSettingsRouteQuery({
    required this.routeId,
    required this.routeName,
  });

  final String? routeId;
  final String? routeName;

  factory _PassengerSettingsRouteQuery.fromState(GoRouterState state) {
    final query = state.uri.queryParameters;
    return _PassengerSettingsRouteQuery(
      routeId: _nullableParam(query['routeId']),
      routeName: _nullableParam(query['routeName']),
    );
  }
}

class _AuthEntryRouteQuery {
  const _AuthEntryRouteQuery({
    required this.nextRole,
    required this.emailMode,
  });

  final String? nextRole;
  final String emailMode;

  factory _AuthEntryRouteQuery.fromState(GoRouterState state) {
    final query = state.uri.queryParameters;
    return _AuthEntryRouteQuery(
      nextRole: _resolveAuthNextRole(query[_authNextRoleQueryKey]),
      emailMode: _resolveAuthEmailMode(query[_authEmailModeQueryKey]),
    );
  }
}

class _JoinRouteQuery {
  const _JoinRouteQuery({
    required this.selectedRole,
  });

  final JoinRole selectedRole;

  factory _JoinRouteQuery.fromState(GoRouterState state) {
    final query = state.uri.queryParameters;
    return _JoinRouteQuery(
      selectedRole: _resolveJoinRoleWithPassengerFallback(
        query[_joinRoleQueryKey],
      ),
    );
  }
}

class _JoinSuccessRouteQuery {
  const _JoinSuccessRouteQuery({
    required this.selectedRole,
    required this.nextPath,
  });

  final JoinRole selectedRole;
  final String? nextPath;

  factory _JoinSuccessRouteQuery.fromState(GoRouterState state) {
    final query = state.uri.queryParameters;
    return _JoinSuccessRouteQuery(
      selectedRole: _resolveJoinRoleWithPassengerFallback(
        query[_joinRoleQueryKey],
      ),
      nextPath: _nullableParam(query[_joinNextPathQueryKey]),
    );
  }
}

class _JoinErrorRouteQuery {
  const _JoinErrorRouteQuery({
    required this.selectedRole,
    required this.reason,
  });

  final JoinRole selectedRole;
  final String reason;

  factory _JoinErrorRouteQuery.fromState(GoRouterState state) {
    final query = state.uri.queryParameters;
    return _JoinErrorRouteQuery(
      selectedRole: _resolveJoinRoleWithPassengerFallback(
        query[_joinRoleQueryKey],
      ),
      reason:
          _nullableParam(query[_joinErrorReasonQueryKey]) ?? _joinErrorUnknown,
    );
  }
}

class _DriverHomeRouteQuery {
  const _DriverHomeRouteQuery({
    required this.previewRouteId,
    required this.startedRouteId,
  });

  final String? previewRouteId;
  final String? startedRouteId;

  factory _DriverHomeRouteQuery.fromState(GoRouterState state) {
    final query = state.uri.queryParameters;
    return _DriverHomeRouteQuery(
      previewRouteId: _nullableParam(query['previewRouteId']),
      startedRouteId: _nullableParam(query['startedRouteId']),
    );
  }
}

class _DriverTripDetailRouteQuery {
  const _DriverTripDetailRouteQuery({
    required this.routeId,
    required this.tripId,
  });

  final String? routeId;
  final String? tripId;

  bool get hasRouteId => routeId != null;

  factory _DriverTripDetailRouteQuery.fromState(GoRouterState state) {
    final query = state.uri.queryParameters;
    return _DriverTripDetailRouteQuery(
      routeId: _nullableParam(query['routeId']),
      tripId: _nullableParam(query['tripId']),
    );
  }
}

class _RouteIdOnlyRouteQuery {
  const _RouteIdOnlyRouteQuery({
    required this.routeId,
  });

  final String? routeId;

  factory _RouteIdOnlyRouteQuery.fromState(GoRouterState state) {
    final query = state.uri.queryParameters;
    return _RouteIdOnlyRouteQuery(
      routeId: _nullableParam(query['routeId']),
    );
  }
}

class _DriverPaywallRouteQuery {
  const _DriverPaywallRouteQuery({
    required this.source,
  });

  final String? source;

  factory _DriverPaywallRouteQuery.fromState(GoRouterState state) {
    final query = state.uri.queryParameters;
    return _DriverPaywallRouteQuery(
      source: _nullableParam(query['source']),
    );
  }
}

class _ActiveTripRouteQuery {
  const _ActiveTripRouteQuery({
    required this.routeId,
    required this.tripId,
    required this.routeName,
    required this.transitionVersion,
  });

  final String? routeId;
  final String? tripId;
  final String routeName;
  final int? transitionVersion;

  factory _ActiveTripRouteQuery.fromState(GoRouterState state) {
    final query = state.uri.queryParameters;
    return _ActiveTripRouteQuery(
      routeId: _nullableParam(query['routeId']),
      tripId: _nullableParam(query['tripId']),
      routeName: _nullableParam(query['routeName']) ?? 'Darica -> GOSB',
      transitionVersion: int.tryParse(
        _nullableParam(query['transitionVersion']) ?? '',
      ),
    );
  }
}

class _DriverTripCompletedRouteQuery {
  const _DriverTripCompletedRouteQuery({
    required this.routeId,
    required this.tripId,
    required this.routeName,
  });

  final String? routeId;
  final String? tripId;
  final String routeName;

  factory _DriverTripCompletedRouteQuery.fromState(GoRouterState state) {
    final query = state.uri.queryParameters;
    return _DriverTripCompletedRouteQuery(
      routeId: _nullableParam(query['routeId']),
      tripId: _nullableParam(query['tripId']),
      routeName: _nullableParam(query['routeName']) ?? 'Şoför Rotası',
    );
  }
}

class _RouterRedirectQuery {
  const _RouterRedirectQuery({
    required this.manualRoleSelection,
    required this.authNextRoleIntent,
  });

  final bool manualRoleSelection;
  final String? authNextRoleIntent;

  factory _RouterRedirectQuery.fromState(GoRouterState state) {
    final query = state.uri.queryParameters;
    return _RouterRedirectQuery(
      manualRoleSelection: query[_roleSelectManualQueryKey] == '1',
      authNextRoleIntent: _resolveAuthNextRole(query[_authNextRoleQueryKey]),
    );
  }
}

JoinRole _resolveJoinRoleWithPassengerFallback(String? rawRole) {
  final selectedRoleRaw = joinRoleFromQuery(rawRole);
  if (selectedRoleRaw == JoinRole.unknown) {
    return JoinRole.passenger;
  }
  return selectedRoleRaw;
}

String? _resolveSrvCodeFromQueryUri(
  Uri uri, {
  required RegExp strictCodeRegex,
}) {
  final queryCandidates = <String?>[
    uri.queryParameters['srv'],
    uri.queryParameters['srvCode'],
    uri.queryParameters['code'],
  ];
  for (final candidate in queryCandidates) {
    final normalized = candidate?.trim().toUpperCase();
    if (normalized != null && strictCodeRegex.hasMatch(normalized)) {
      return normalized;
    }
  }
  return null;
}
