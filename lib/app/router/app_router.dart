import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../config/app_flavor.dart';
import '../../ui/components/layout/amber_screen_scaffold.dart';
import '../../ui/screens/active_trip_screen.dart';
import '../../ui/screens/auth_hero_login_screen.dart';
import '../../ui/screens/driver_home_screen.dart';
import '../../ui/screens/passenger_tracking_screen.dart';
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
        builder: (context, state) => _ShellPlaceholderPage(
          title: 'Join',
          body: _joinPlaceholderBody(
            state.uri.queryParameters['role'],
          ),
        ),
      ),
      GoRoute(
        path: AppRoutePath.settings,
        builder: (context, state) => const _ShellPlaceholderPage(
          title: 'Settings',
          body: 'Settings placeholder',
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

String _joinPlaceholderBody(String? selectedRole) {
  switch (selectedRole) {
    case 'driver':
      return 'Driver join flow placeholder';
    case 'passenger':
      return 'Passenger join flow placeholder';
    default:
      return 'Join by srv code placeholder';
  }
}

class _ShellPlaceholderPage extends StatelessWidget {
  const _ShellPlaceholderPage({
    required this.title,
    required this.body,
  });

  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    return AmberScreenScaffold(
      title: title,
      body: Center(
        child: Text(
          body,
          textAlign: TextAlign.center,
        ),
      ),
    );
  }
}
