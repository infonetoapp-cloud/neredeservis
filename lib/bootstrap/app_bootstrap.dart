import 'dart:async';

import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../app/nerede_servis_app.dart';
import '../config/app_environment.dart';
import '../config/app_flavor.dart';
import '../features/auth/data/identity_toolkit_auth_runtime.dart';
import '../features/subscription/data/adapty_bootstrap.dart';

Future<void> bootstrapNeredeServis({
  required AppFlavor flavor,
  required AppEnvironment environment,
}) async {
  WidgetsFlutterBinding.ensureInitialized();

  try {
    await initializeAdaptyForFlavor(
      flavor: flavor,
      environment: environment,
    );
  } catch (error, stackTrace) {
    // Monetization bootstrap must never block app startup in V1.0.
    debugPrint('Adapty bootstrap failed: $error');
    debugPrintStack(stackTrace: stackTrace);
  }

  identityToolkitAuthRuntime.configure(
    flavor: flavor,
    webApiKey: environment.firebaseWebApiKey,
  );
  await identityToolkitAuthRuntime.initialize();

  runApp(
    ProviderScope(
      child: NeredeServisApp(
        flavorConfig: configForFlavor(flavor),
        environment: environment,
      ),
    ),
  );
}
