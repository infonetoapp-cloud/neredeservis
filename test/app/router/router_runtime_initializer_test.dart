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
      environment: const AppEnvironment(
        flavor: AppFlavor.stg,
        sentryEnabled: true,
        sentryDsn: 'dsn',
        analyticsCollectionEnabled: false,
        appCheckDebugProviderEnabled: true,
        firebaseWebApiKey: 'AIzaSyDGX_QJV5dCQVII6k13A3FZ-gUb8GkDTX4', //gitleaks:allow
        adaptyEnabled: false,
        adaptyApiKey: null,
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
