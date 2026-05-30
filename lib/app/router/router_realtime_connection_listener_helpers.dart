import 'dart:async';

import 'router_runtime_gateway.dart';

typedef RouterRealtimeConnectionChanged = void Function(bool connected);

StreamSubscription<bool> startRouterRealtimeConnectionListener({
  required RouterRealtimeConnectionChanged onConnectionChanged,
  void Function(Object error)? onError,
  RouterRuntimeGateway? runtimeGateway,
}) {
  final targetStream = (runtimeGateway ?? routerRuntimeGateway)
      .watchRuntimeConnectionStatus();
  return targetStream.listen(
    onConnectionChanged,
    onError: onError,
  );
}
