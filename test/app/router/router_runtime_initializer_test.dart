import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/app/router/router_runtime_initializer.dart';
import 'package:neredeservis/config/app_environment.dart';
import 'package:neredeservis/config/app_flavor.dart';

void main() {
  test('RouterRuntimeInitializer triggers hydration and telemetry config',
      () async {
    var hydrated = false;
    Map<String, Object?>? telemetryArgs;

    final initializer = RouterRuntimeInitializer(
      hydrateSessionRolePreference: () async {
        hydrated = true;
      },
      configureTelemetry: ({
        required bool analyticsEnabled,
        required bool breadcrumbEnabled,
        required String environment,
      }) {
        telemetryArgs = <String, Object?>{
          'analyticsEnabled': analyticsEnabled,
          'breadcrumbEnabled': breadcrumbEnabled,
          'environment': environment,
        };
      },
    );

    initializer.initialize(
      environment: AppEnvironment(
        flavor: AppFlavor.stg,
        sentryEnabled: true,
        sentryDsn: 'dsn',
        analyticsCollectionEnabled: false,
        appCheckDebugProviderEnabled: true,
        googleSignInServerClientId: null,
        adaptyEnabled: false,
        adaptyApiKey: null,
        mapboxPublicToken: null,
        mapboxTileCacheMb: 128,
        mapboxStylePreloadEnabled: true,
      ),
    );

    await Future<void>.delayed(Duration.zero);

    expect(hydrated, isTrue);
    expect(
      telemetryArgs,
      <String, Object?>{
        'analyticsEnabled': false,
        'breadcrumbEnabled': true,
        'environment': 'stg',
      },
    );
  });
}
