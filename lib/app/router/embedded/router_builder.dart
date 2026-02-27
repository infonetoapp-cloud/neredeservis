part of '../app_router.dart';

class _AppRouterRouteDeps {
  const _AppRouterRouteDeps({
    required this.flavorConfig,
    required this.environment,
    required this.readCurrentRole,
    required this.readHasLocationConsent,
  });

  final AppFlavorConfig flavorConfig;
  final AppEnvironment environment;
  final UserRole Function() readCurrentRole;
  final bool Function() readHasLocationConsent;
}

void initializeAppRouterRuntime({
  required AppEnvironment environment,
}) {
  RouterRuntimeInitializer(
    hydrateSessionRolePreference: _hydrateSessionRolePreference,
    configureTelemetry: ({
      required analyticsEnabled,
      required breadcrumbEnabled,
      required environment,
    }) {
      _mobileTelemetry.configure(
        analyticsEnabled: analyticsEnabled,
        breadcrumbEnabled: breadcrumbEnabled,
        environment: environment,
      );
    },
  ).initialize(environment: environment);
}

GoRouter buildAppRouter({
  required AppFlavorConfig flavorConfig,
  required AppEnvironment environment,
  required bool Function() readIsSignedIn,
  required UserRole Function() readCurrentRole,
  required bool Function() readHasLocationConsent,
  required Listenable refreshListenable,
}) {
  final routeDeps = _AppRouterRouteDeps(
    flavorConfig: flavorConfig,
    environment: environment,
    readCurrentRole: readCurrentRole,
    readHasLocationConsent: readHasLocationConsent,
  );
  return GoRouter(
    initialLocation: AppRoutePath.roleSelect,
    refreshListenable: Listenable.merge(
      <Listenable>[
        refreshListenable,
        _sessionRoleRefreshNotifier,
      ],
    ),
    routes: <RouteBase>[
      ..._buildPublicEntryRoutes(routeDeps),
      ..._buildDriverRoutes(routeDeps),
      ..._buildPassengerRoutes(routeDeps),
      ..._buildPublicJoinRoutes(routeDeps),
      ..._buildSharedRoutes(routeDeps),
    ],
    redirect: (context, state) {
      final location = state.matchedLocation;
      final query = _RouterRedirectQuery.fromState(state);
      final manualRoleSelection = query.manualRoleSelection;
      final authNextRoleIntent = query.authNextRoleIntent;
      final hasPendingAuthRoleIntent = authNextRoleIntent != null &&
          (location == AppRoutePath.auth ||
              location == AppRoutePath.authEmail ||
              location == AppRoutePath.splash);
      final isSignedIn = readIsSignedIn();
      final backendRole = readCurrentRole();
      final currentRole = _resolveRoutingRoleWithSessionPreference(
        backendRole: backendRole,
      );
      final authGuard = AuthGuard(isSignedIn: isSignedIn);
      final roleGuard = RoleGuard(currentRole: currentRole);
      final consentGuard = ConsentGuard(
        currentRole: currentRole,
        hasLocationConsent: readHasLocationConsent(),
      );

      final shouldAutoRedirectSignedInEntry = isSignedIn &&
          _signedInEntryRoutes.contains(location) &&
          _sessionRoleHydrated &&
          !manualRoleSelection &&
          !hasPendingAuthRoleIntent;
      if (shouldAutoRedirectSignedInEntry) {
        final landing = _resolveSignedInLandingFromUserRole(currentRole);
        if (landing != null && landing != location) {
          return landing;
        }
      }

      final authRedirect = authGuard.redirect(location);
      if (authRedirect != null && authRedirect != location) {
        return authRedirect;
      }

      final roleRedirect = roleGuard.redirect(location);
      if (roleRedirect != null && roleRedirect != location) {
        return roleRedirect;
      }

      final consentRedirect = consentGuard.redirect(location);
      if (consentRedirect != null && consentRedirect != location) {
        return consentRedirect;
      }

      return null;
    },
  );
}
