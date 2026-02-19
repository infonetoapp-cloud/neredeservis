import 'dart:async';

import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart';

import '../app/nerede_servis_app.dart';
import '../config/app_environment.dart';
import '../config/app_flavor.dart';
import '../features/location/infrastructure/mapbox_offline_cache_service.dart';
import '../features/subscription/data/adapty_bootstrap.dart';
import '../firebase/app_check_bootstrap.dart';
import '../firebase/firebase_bootstrap.dart';

Future<void> bootstrapNeredeServis({
  required AppFlavor flavor,
  required AppEnvironment environment,
}) async {
  WidgetsFlutterBinding.ensureInitialized();
  var firebaseInitialized = false;

  try {
    await initializeFirebaseForFlavor(
      flavor: flavor,
      environment: environment,
    );
    firebaseInitialized = true;
  } catch (error, stackTrace) {
    debugPrint('Firebase bootstrap failed: $error');
    debugPrintStack(stackTrace: stackTrace);
  }

  if (firebaseInitialized) {
    try {
      await initializeAppCheckForFlavor(
        flavor: flavor,
        environment: environment,
      );
    } catch (error, stackTrace) {
      debugPrint('App Check bootstrap failed: $error');
      debugPrintStack(stackTrace: stackTrace);
    }
  }

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

  final mapboxPublicToken = environment.mapboxPublicToken;
  if (mapboxPublicToken != null) {
    MapboxOptions.setAccessToken(mapboxPublicToken);
    final mapboxOfflineCacheService = MapboxOfflineCacheService(
      config: MapboxOfflineCacheConfig(
        tileCacheMb: environment.mapboxTileCacheMb,
        stylePreloadEnabled: environment.mapboxStylePreloadEnabled,
      ),
    );
    unawaited(
      mapboxOfflineCacheService.warmUp(
        mapboxPublicToken: mapboxPublicToken,
      ),
    );
  }

  runApp(
    ProviderScope(
      child: NeredeServisApp(
        flavorConfig: configForFlavor(flavor),
        environment: environment,
      ),
    ),
  );
}
