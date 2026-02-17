import 'package:flutter/widgets.dart';

import '../app/nerede_servis_app.dart';
import '../config/app_flavor.dart';
import '../firebase/firebase_bootstrap.dart';

Future<void> bootstrapNeredeServis(AppFlavor flavor) async {
  WidgetsFlutterBinding.ensureInitialized();
  await initializeFirebaseForFlavor(flavor);
  runApp(NeredeServisApp(flavorConfig: configForFlavor(flavor)));
}
