import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:sentry_flutter/sentry_flutter.dart';

import '../config/app_environment.dart';
import '../config/app_flavor.dart';
import 'app_bootstrap.dart';

Future<void> runFlavorEntrypoint(AppFlavor entrypointFlavor) async {
  final environment = loadEnvironment(entrypointFlavor: entrypointFlavor);

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
    await runZonedGuarded(
      () async {
        await bootstrapNeredeServis(
          flavor: environment.flavor,
          environment: environment,
        );
      },
      (Object error, StackTrace stackTrace) {
        if (environment.sentryEnabled) {
          unawaited(Sentry.captureException(error, stackTrace: stackTrace));
        }
        debugPrint('Unhandled bootstrap error: $error');
      },
    );
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
}
