import 'package:firebase_core/firebase_core.dart';

import '../config/app_flavor.dart';
import 'firebase_options_dev.dart' as dev;
import 'firebase_options_prod.dart' as prod;
import 'firebase_options_stg.dart' as stg;

Future<void> initializeFirebaseForFlavor(AppFlavor flavor) {
  switch (flavor) {
    case AppFlavor.dev:
      return Firebase.initializeApp(
        options: dev.DefaultFirebaseOptions.currentPlatform,
      );
    case AppFlavor.stg:
      return Firebase.initializeApp(
        options: stg.DefaultFirebaseOptions.currentPlatform,
      );
    case AppFlavor.prod:
      return Firebase.initializeApp(
        options: prod.DefaultFirebaseOptions.currentPlatform,
      );
  }
}
