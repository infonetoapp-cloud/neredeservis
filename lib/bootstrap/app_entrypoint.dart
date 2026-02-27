import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:sentry_flutter/sentry_flutter.dart';

import '../config/app_environment.dart';
import '../config/app_flavor.dart';
import '../core/telemetry/firebase_telemetry_sink.dart';
import '../core/telemetry/mobile_event_names.dart';
import '../core/telemetry/mobile_telemetry.dart';
import 'app_bootstrap.dart';

Future<void> runFlavorEntrypoint(AppFlavor entrypointFlavor) async {
  final startupStopwatch = Stopwatch()..start();
  final environment = loadEnvironment(entrypointFlavor: entrypointFlavor);
  debugPrint(
    'Entrypoint env -> flavor=${environment.name}, sentryEnabled=${environment.sentryEnabled}, sentryDsnConfigured=${environment.sentryDsn != null}',
  );
  MobileTelemetry.instance.configure(
    analyticsEnabled: environment.analyticsCollectionEnabled,
    breadcrumbEnabled: environment.sentryEnabled,
    environment: environment.name,
  );
  MobileTelemetry.instance.setTestHooks(
    recordSink: FirebaseTelemetrySink.instance.handleRecord,
  );

  FlutterError.onError = (FlutterErrorDetails details) {
    FlutterError.presentError(details);
    if (environment.sentryEnabled) {
      unawaited(
        Sentry.captureException(
          details.exception,
          stackTrace: details.stack,
        ),
      );
    }
    Zone.current.handleUncaughtError(
      details.exception,
      details.stack ?? StackTrace.current,
    );
  };

  PlatformDispatcher.instance.onError = (Object error, StackTrace stackTrace) {
    if (environment.sentryEnabled) {
      unawaited(Sentry.captureException(error, stackTrace: stackTrace));
    }
    return true;
  };

  Future<void> guardedBootstrap() async {
    try {
      await bootstrapNeredeServis(
        flavor: environment.flavor,
        environment: environment,
      );
    } catch (error, stackTrace) {
      if (environment.sentryEnabled) {
        unawaited(Sentry.captureException(error, stackTrace: stackTrace));
      }
      debugPrint('Unhandled bootstrap error: $error');
      debugPrintStack(stackTrace: stackTrace);
    }
  }

  if (environment.sentryEnabled && environment.sentryDsn != null) {
    await SentryFlutter.init((options) {
      options.dsn = environment.sentryDsn!;
      options.environment = environment.name;
      options.enableAppLifecycleBreadcrumbs = true;
      options.enableWindowMetricBreadcrumbs = true;
      options.tracesSampleRate = environment.isProduction ? 0.05 : 1.0;
    });
  }

  await guardedBootstrap();
  MobileTelemetry.instance.trackPerf(
    eventName: MobileEventNames.appStartup,
    durationMs: startupStopwatch.elapsedMilliseconds,
    attributes: <String, Object?>{
      'flavor': environment.name,
    },
  );
}
