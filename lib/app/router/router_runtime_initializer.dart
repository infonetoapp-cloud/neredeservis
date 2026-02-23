import 'dart:async';

import '../../config/app_environment.dart';

typedef RouterTelemetryConfigurator = void Function({
  required bool analyticsEnabled,
  required bool breadcrumbEnabled,
  required String environment,
});

class RouterRuntimeInitializer {
  const RouterRuntimeInitializer({
    required RouterTelemetryConfigurator configureTelemetry,
    required Future<void> Function() hydrateSessionRolePreference,
  })  : _configureTelemetry = configureTelemetry,
        _hydrateSessionRolePreference = hydrateSessionRolePreference;

  final RouterTelemetryConfigurator _configureTelemetry;
  final Future<void> Function() _hydrateSessionRolePreference;

  void initialize({
    required AppEnvironment environment,
  }) {
    unawaited(_hydrateSessionRolePreference());
    _configureTelemetry(
      analyticsEnabled: environment.analyticsCollectionEnabled,
      breadcrumbEnabled: environment.sentryEnabled,
      environment: environment.name,
    );
  }
}
