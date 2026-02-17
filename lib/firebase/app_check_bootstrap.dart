import 'package:firebase_app_check/firebase_app_check.dart';
import 'package:flutter/foundation.dart' show kIsWeb;

import '../config/app_environment.dart';
import '../config/app_flavor.dart';

bool _isAppCheckActivated = false;

Future<void> initializeAppCheckForFlavor({
  required AppFlavor flavor,
  required AppEnvironment environment,
}) async {
  if (kIsWeb || _isAppCheckActivated) {
    return;
  }

  final useDebugProvider =
      environment.appCheckDebugProviderEnabled && flavor != AppFlavor.prod;

  await FirebaseAppCheck.instance.activate(
    androidProvider:
        useDebugProvider ? AndroidProvider.debug : AndroidProvider.playIntegrity,
    appleProvider: useDebugProvider ? AppleProvider.debug : AppleProvider.deviceCheck,
  );

  _isAppCheckActivated = true;
}
