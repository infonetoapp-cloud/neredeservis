import 'dart:async';

import 'package:http/http.dart' as http;

import '../../config/backend_api.dart';

abstract class RouterRuntimeGateway {
  Future<String?> fetchMessagingToken();
  Stream<String> get messagingTokenRefreshStream;
  Stream<bool> watchRuntimeConnectionStatus();
}

const RouterRuntimeGateway routerRuntimeGateway =
    DefaultRouterRuntimeGateway();

final http.Client _routerRuntimeHealthHttpClient = http.Client();

class DefaultRouterRuntimeGateway implements RouterRuntimeGateway {
  const DefaultRouterRuntimeGateway();

  static const Duration _connectionPollInterval = Duration(seconds: 15);
  static const Duration _requestTimeout = Duration(seconds: 5);

  @override
  Future<String?> fetchMessagingToken() async => null;

  @override
  Stream<String> get messagingTokenRefreshStream =>
      const Stream<String>.empty();

  @override
  Stream<bool> watchRuntimeConnectionStatus() async* {
    bool? lastConnected;

    while (true) {
      final nextConnected = await _probeBackendHealth();
      if (nextConnected != lastConnected) {
        lastConnected = nextConnected;
        yield nextConnected;
      }
      await Future<void>.delayed(_connectionPollInterval);
    }
  }

  Future<bool> _probeBackendHealth() async {
    try {
      final response = await _routerRuntimeHealthHttpClient
          .get(resolveBackendApiUri('/healthz'))
          .timeout(_requestTimeout);
      return response.statusCode >= 200 && response.statusCode < 500;
    } catch (_) {
      return false;
    }
  }
}
