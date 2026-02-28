import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:firebase_database/firebase_database.dart';
import 'package:firebase_messaging/firebase_messaging.dart';

import '../../config/firebase_regions.dart';

abstract class RouterFirebaseRuntimeGateway {
  FirebaseFirestore get firestore;
  FirebaseFunctions get functions;
  FirebaseDatabase get realtimeDatabase;
  Future<String?> fetchMessagingToken();
  Stream<String> get messagingTokenRefreshStream;
  Stream<DatabaseEvent> watchRealtimeConnectionInfo();
  Stream<DatabaseEvent> watchRouteLocationValue(String routeId);
}

const RouterFirebaseRuntimeGateway routerFirebaseRuntimeGateway =
    DefaultRouterFirebaseRuntimeGateway();

class DefaultRouterFirebaseRuntimeGateway
    implements RouterFirebaseRuntimeGateway {
  const DefaultRouterFirebaseRuntimeGateway();

  @override
  FirebaseFirestore get firestore => FirebaseFirestore.instance;

  @override
  FirebaseFunctions get functions =>
      FirebaseFunctions.instanceFor(region: firebaseFunctionsRegion);

  @override
  FirebaseDatabase get realtimeDatabase => FirebaseDatabase.instance;

  @override
  Future<String?> fetchMessagingToken() =>
      FirebaseMessaging.instance.getToken();

  @override
  Stream<String> get messagingTokenRefreshStream =>
      FirebaseMessaging.instance.onTokenRefresh;

  @override
  Stream<DatabaseEvent> watchRealtimeConnectionInfo() =>
      realtimeDatabase.ref('.info/connected').onValue;

  @override
  Stream<DatabaseEvent> watchRouteLocationValue(String routeId) =>
      realtimeDatabase.ref('locations/$routeId').onValue;
}
