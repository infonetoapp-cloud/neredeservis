import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../config/app_flavor.dart';
import 'app_route_paths.dart';
import 'auth_guard.dart';
import 'role_guard.dart';

GoRouter buildAppRouter({
  required AppFlavorConfig flavorConfig,
  required AuthGuard authGuard,
  required RoleGuard roleGuard,
}) {
  return GoRouter(
    initialLocation: AppRoutePath.splash,
    routes: <RouteBase>[
      GoRoute(
        path: AppRoutePath.splash,
        builder: (context, state) => _ShellPlaceholderPage(
          title: flavorConfig.appName,
          body: 'Splash / Router Skeleton (${flavorConfig.flavor.name})',
        ),
      ),
      GoRoute(
        path: AppRoutePath.auth,
        builder: (context, state) => const _ShellPlaceholderPage(
          title: 'Auth',
          body: 'Auth guard entrypoint placeholder',
        ),
      ),
      GoRoute(
        path: AppRoutePath.driverHome,
        builder: (context, state) => const _ShellPlaceholderPage(
          title: 'Driver Home',
          body: 'Driver area placeholder',
        ),
      ),
      GoRoute(
        path: AppRoutePath.passengerHome,
        builder: (context, state) => const _ShellPlaceholderPage(
          title: 'Passenger Home',
          body: 'Passenger area placeholder',
        ),
      ),
      GoRoute(
        path: AppRoutePath.join,
        builder: (context, state) => const _ShellPlaceholderPage(
          title: 'Join',
          body: 'Join by srv code placeholder',
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

class _ShellPlaceholderPage extends StatelessWidget {
  const _ShellPlaceholderPage({
    required this.title,
    required this.body,
  });

  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: Center(
        child: Text(
          body,
          textAlign: TextAlign.center,
        ),
      ),
    );
  }
}
