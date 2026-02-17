import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart' show kIsWeb;

import '../config/app_environment.dart';
import '../config/app_flavor.dart';

Future<FirebaseApp> initializeFirebaseForFlavor({
  required AppFlavor flavor,
  required AppEnvironment environment,
}) {
  if (kIsWeb) {
    throw UnsupportedError(
      'Web Firebase bootstrap is not configured in V1.0 mobile scope.',
    );
  }

  // Flavor bootstrap contract:
  // - Android: src/<flavor>/google-services.json
  // - iOS: firebase/<flavor>/GoogleService-Info.plist copied at build phase
  assert(
    environment.flavor == flavor,
    'Entrypoint flavor and loaded environment flavor diverged.',
  );

  if (Firebase.apps.isNotEmpty) {
    return Future<FirebaseApp>.value(Firebase.app());
  }
  return Firebase.initializeApp();
}
