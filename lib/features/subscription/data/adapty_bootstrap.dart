import 'package:adapty_flutter/adapty_flutter.dart';
import 'package:flutter/foundation.dart'
    show debugPrint, debugPrintStack, kIsWeb;

import '../../../config/app_environment.dart';
import '../../../config/app_flavor.dart';

bool _isAdaptyActivated = false;

Future<void> initializeAdaptyForFlavor({
  required AppFlavor flavor,
  required AppEnvironment environment,
}) async {
  if (kIsWeb || _isAdaptyActivated || !environment.adaptyEnabled) {
    return;
  }

  final apiKey = environment.adaptyApiKey;
  if (apiKey == null) {
    return;
  }

  if (flavor != AppFlavor.prod) {
    try {
      await Adapty().setLogLevel(AdaptyLogLevel.verbose);
    } catch (_) {
      // Best-effort debug visibility only.
    }
  }

  final configurations = <AdaptyConfiguration>[
    _buildConfiguration(apiKey),
    _buildConfiguration(
      apiKey,
      serverCluster: AdaptyServerCluster.eu,
    ),
  ];

  var attempt = 0;
  for (final configuration in configurations) {
    attempt++;
    try {
      await Adapty().activate(configuration: configuration);
      _isAdaptyActivated = true;
      return;
    } catch (error, stackTrace) {
      // Billing SDK activation must never block app startup in V1.0.
      debugPrint('Adapty activation failed (attempt $attempt): $error');
      debugPrintStack(stackTrace: stackTrace);
    }
  }
}

AdaptyConfiguration _buildConfiguration(
  String apiKey, {
  AdaptyServerCluster? serverCluster,
}) {
  final configuration = AdaptyConfiguration(apiKey: apiKey)
    ..withActivateUI(false);
  if (serverCluster != null) {
    configuration.withServerCluster(serverCluster);
  }
  return configuration;
}
