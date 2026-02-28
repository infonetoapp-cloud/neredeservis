part of '../app_router.dart';

List<RouteBase> _buildPassengerRoutes(_AppRouterRouteDeps deps) {
  return <RouteBase>[
    ShellRoute(
      builder: (context, state, child) => PassengerShell(child: child),
      routes: <RouteBase>[
        GoRoute(
          path: AppRoutePath.passengerHome,
          builder: (context, state) {
            var switchSourceRole = UserRole.unknown;
            return RouterDoubleBackExitGuard(
              onBackBlocked: _showDoubleBackExitHint,
              child: RouterPassengerHomeEntryGuard(
                resolveTargetLocation: () async {
                  switchSourceRole = _snapshotRoleSwitchSourceRole();
                  final user = _authCredentialGateway.currentUser;
                  if (user == null || user.isAnonymous) {
                    return _buildAuthRouteWithNextRole(_authNextRolePassenger);
                  }
                  return _resolvePassengerHomeDestination(user);
                },
                applyNavigation: (context, destination) {
                  _applyRoleSwitchNavigationPlan(
                    context,
                    fromRole: switchSourceRole,
                    toRole: UserRole.passenger,
                    targetLocation: destination,
                  );
                },
              ),
            );
          },
        ),
        GoRoute(
          path: AppRoutePath.passengerTripHistory,
          builder: (context, state) {
            return const TripHistoryScreen(
              audience: TripHistoryAudience.passenger,
              loadItems: _loadPassengerTripHistoryItems,
            );
          },
        ),
        GoRoute(
          path: AppRoutePath.passengerTracking,
          builder: (context, state) => RouterDoubleBackExitGuard(
            onBackBlocked: _showDoubleBackExitHint,
            child:
                _buildPassengerTrackingRoute(context, state, deps.environment),
          ),
        ),
        GoRoute(
          path: AppRoutePath.tripChat,
          builder: (context, state) {
            final query = _TripChatRouteQuery.fromState(state);
            if (!query.hasRequiredIds) {
              return Scaffold(
                appBar: AppBar(title: const Text('Sohbet')),
                body: const Center(
                  child: Text('Sohbet bilgisi eksik. L?tfen tekrar dene.'),
                ),
              );
            }
            return TripChatScreen(
              routeId: query.routeId!,
              conversationId: query.conversationId!,
              counterpartName: query.counterpartName,
              counterpartSubtitle: query.counterpartSubtitle,
            );
          },
        ),
        GoRoute(
          path: AppRoutePath.passengerSettings,
          builder: (context, state) {
            final query = _PassengerSettingsRouteQuery.fromState(state);
            return PassengerSettingsScreen(
              routeId: query.routeId ?? '',
              routeName: query.routeName,
              onSave: (input) => _handleUpdatePassengerSettings(context, input),
            );
          },
        ),
      ],
    ),
  ];
}
