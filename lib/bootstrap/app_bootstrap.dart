import 'package:flutter/widgets.dart';

import '../app/nerede_servis_app.dart';
import '../config/app_environment.dart';
import '../config/app_flavor.dart';
import '../firebase/app_check_bootstrap.dart';
import '../firebase/firebase_bootstrap.dart';

Future<void> bootstrapNeredeServis({
  required AppFlavor flavor,
  required AppEnvironment environment,
}) async {
  WidgetsFlutterBinding.ensureInitialized();
  await initializeFirebaseForFlavor(
    flavor: flavor,
    environment: environment,
  );
  await initializeAppCheckForFlavor(
    flavor: flavor,
    environment: environment,
  );
  runApp(NeredeServisApp(flavorConfig: configForFlavor(flavor)));
}
