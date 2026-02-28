import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/config/app_environment.dart';
import 'package:neredeservis/config/app_flavor.dart';

void main() {
  AppEnvironment build({
    bool exceptionEnabled = false,
    bool legalApproved = false,
    String? manageUrl,
  }) {
    return AppEnvironment(
      flavor: AppFlavor.dev,
      sentryEnabled: false,
      sentryDsn: null,
      appCheckDebugProviderEnabled: true,
      googleSignInServerClientId: null,
      adaptyEnabled: false,
      adaptyApiKey: null,
      mapboxPublicToken: null,
      mapboxTileCacheMb: 256,
      mapboxStylePreloadEnabled: true,
      externalBillingExceptionEnabled: exceptionEnabled,
      externalBillingLegalApproved: legalApproved,
      externalBillingManageUrl: manageUrl,
    );
  }

  test('regional external billing exception is disabled by default', () {
    final environment = build();
    expect(environment.isExternalBillingExceptionActive, isFalse);
  });

  test('exception requires feature flag + legal approval + url', () {
    expect(
      build(
        exceptionEnabled: true,
        legalApproved: false,
        manageUrl: 'https://example.com',
      ).isExternalBillingExceptionActive,
      isFalse,
    );
    expect(
      build(
        exceptionEnabled: true,
        legalApproved: true,
        manageUrl: null,
      ).isExternalBillingExceptionActive,
      isFalse,
    );
    expect(
      build(
        exceptionEnabled: true,
        legalApproved: true,
        manageUrl: 'https://example.com',
      ).isExternalBillingExceptionActive,
      isTrue,
    );
  });

  test('loadEnvironment keeps analytics enabled for dev by default', () {
    final environment = loadEnvironment(entrypointFlavor: AppFlavor.dev);
    expect(environment.analyticsCollectionEnabled, isTrue);
  });

  test('loadEnvironment forces analytics off for prod profile', () {
    final environment = loadEnvironment(entrypointFlavor: AppFlavor.prod);
    expect(environment.analyticsCollectionEnabled, isFalse);
  });
}
