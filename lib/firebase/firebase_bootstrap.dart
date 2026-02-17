import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart' show kIsWeb;

import '../config/app_flavor.dart';

Future<void> initializeFirebaseForFlavor(AppFlavor flavor) {
  if (kIsWeb) {
    throw UnsupportedError(
      'Web Firebase bootstrap is not configured in V1.0 mobile scope.',
    );
  }
  // Mobile platforms read Firebase config from native files:
  // - Android: google-services.json (flavor-based)
  // - iOS: GoogleService-Info.plist
  return Firebase.initializeApp();
}
