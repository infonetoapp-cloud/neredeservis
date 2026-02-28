import 'dart:async';

import 'package:firebase_database/firebase_database.dart';

import 'router_firebase_runtime_gateway.dart';

typedef RouterRealtimeConnectionChanged = void Function(bool connected);

StreamSubscription<DatabaseEvent> startRouterRealtimeConnectionListener({
  required RouterRealtimeConnectionChanged onConnectionChanged,
  void Function(Object error)? onError,
  FirebaseDatabase? database,
  RouterFirebaseRuntimeGateway? runtimeGateway,
}) {
  final targetDatabase = database ??
      (runtimeGateway ?? routerFirebaseRuntimeGateway).realtimeDatabase;
  return targetDatabase.ref('.info/connected').onValue.listen(
    (event) {
      onConnectionChanged(event.snapshot.value == true);
    },
    onError: onError,
  );
}
