part of '../app_router.dart';

List<RouteBase> _buildPassengerRoutes(_AppRouterRouteDeps deps) {
  return <RouteBase>[
    ShellRoute(
      builder: (context, state, child) => PassengerShell(child: child),
      routes: <RouteBase>[
        GoRoute(
          path: AppRoutePath.passengerHome,
          builder: (context, state) => const _DoubleBackExitGuard(
            child: _PassengerHomeEntryGuard(),
          ),
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
          builder: (context, state) => _DoubleBackExitGuard(
            child:
                _buildPassengerTrackingRoute(context, state, deps.environment),
          ),
        ),
        GoRoute(
          path: AppRoutePath.tripChat,
          builder: (context, state) {
            final routeId =
                _nullableParam(state.uri.queryParameters['routeId']);
            final conversationId =
                _nullableParam(state.uri.queryParameters['conversationId']);
            final counterpartName =
                _nullableParam(state.uri.queryParameters['counterpartName']) ??
                    'Sohbet';
            final counterpartSubtitle = _nullableParam(
                state.uri.queryParameters['counterpartSubtitle']);
            if (routeId == null || conversationId == null) {
              return Scaffold(
                appBar: AppBar(title: const Text('Sohbet')),
                body: const Center(
                  child: Text('Sohbet bilgisi eksik. LÃƒÂ¼tfen tekrar dene.'),
                ),
              );
            }
            return TripChatScreen(
              routeId: routeId,
              conversationId: conversationId,
              counterpartName: counterpartName,
              counterpartSubtitle: counterpartSubtitle,
            );
          },
        ),
        GoRoute(
          path: AppRoutePath.passengerSettings,
          builder: (context, state) {
            final routeId =
                _nullableParam(state.uri.queryParameters['routeId']);
            final routeName =
                _nullableParam(state.uri.queryParameters['routeName']);
            return PassengerSettingsScreen(
              routeId: routeId ?? '',
              routeName: routeName,
              onSave: (input) => _handleUpdatePassengerSettings(context, input),
            );
          },
        ),
      ],
    ),
  ];
}
