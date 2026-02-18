import 'package:go_router/go_router.dart';

import '../../config/app_flavor.dart';
import '../../ui/screens/active_trip_screen.dart';
import '../../ui/screens/auth_hero_login_screen.dart';
import '../../ui/screens/driver_home_screen.dart';
import '../../ui/screens/join_screen.dart';
import '../../ui/screens/passenger_tracking_screen.dart';
import '../../ui/screens/settings_screen.dart';
import 'app_route_paths.dart';
import 'auth_guard.dart';
import 'role_guard.dart';

GoRouter buildAppRouter({
  required AppFlavorConfig flavorConfig,
  required AuthGuard authGuard,
  required RoleGuard roleGuard,
}) {
  return GoRouter(
    initialLocation: AppRoutePath.auth,
    routes: <RouteBase>[
      GoRoute(
        path: AppRoutePath.auth,
        builder: (context, state) => AuthHeroLoginScreen(
          appName: flavorConfig.appName,
          onSignInTap: () => context.go(AppRoutePath.join),
          onGoogleSignInTap: () => context.go(AppRoutePath.join),
          onRegisterTap: () => context.go(AppRoutePath.join),
        ),
      ),
      GoRoute(
        path: AppRoutePath.splash,
        builder: (context, state) => AuthHeroLoginScreen(
          appName: flavorConfig.appName,
          onSignInTap: () => context.go(AppRoutePath.join),
          onGoogleSignInTap: () => context.go(AppRoutePath.join),
          onRegisterTap: () => context.go(AppRoutePath.join),
        ),
      ),
      GoRoute(
        path: AppRoutePath.driverHome,
        builder: (context, state) => DriverHomeScreen(
          appName: flavorConfig.appName,
          onStartTripTap: () => context.go(AppRoutePath.activeTrip),
          onManageRouteTap: () => context.go(AppRoutePath.settings),
          onAnnouncementTap: () => context.go(AppRoutePath.settings),
        ),
      ),
      GoRoute(
        path: AppRoutePath.activeTrip,
        builder: (context, state) => const ActiveTripScreen(),
      ),
      GoRoute(
        path: AppRoutePath.passengerHome,
        builder: (context, state) => const PassengerTrackingScreen(),
      ),
      GoRoute(
        path: AppRoutePath.passengerTracking,
        builder: (context, state) => const PassengerTrackingScreen(),
      ),
      GoRoute(
        path: AppRoutePath.join,
        builder: (context, state) => JoinScreen(
          selectedRole: joinRoleFromQuery(state.uri.queryParameters['role']),
          onJoinByCode: (_) => context.go(AppRoutePath.passengerTracking),
          onScanQrTap: () => context.go(AppRoutePath.passengerTracking),
          onContinueDriverTap: () => context.go(AppRoutePath.driverHome),
        ),
      ),
      GoRoute(
        path: AppRoutePath.settings,
        builder: (context, state) => SettingsScreen(
          appName: flavorConfig.appName,
        ),
      ),
    ],
    redirect: (context, state) {
      final location = state.matchedLocation;

      final authRedirect = authGuard.redirect(location);
      if (authRedirect != null && authRedirect != location) {
        return authRedirect;
      }

      final roleRedirect = roleGuard.redirect(location);
      if (roleRedirect != null && roleRedirect != location) {
        return roleRedirect;
      }

      return null;
    },
  );
}
