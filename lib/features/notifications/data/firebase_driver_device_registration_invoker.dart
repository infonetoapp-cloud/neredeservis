import 'package:cloud_functions/cloud_functions.dart';

import '../../../config/firebase_regions.dart';

typedef NotificationCallableInvoker = Future<dynamic> Function(
  String callableName,
  Map<String, dynamic> input,
);

class FirebaseDriverDeviceRegistrationInvoker {
  FirebaseDriverDeviceRegistrationInvoker({
    FirebaseFunctions? functions,
    NotificationCallableInvoker? invoker,
  })  : _functions = functions,
        _invoker = invoker;

  FirebaseFunctions? _functions;
  final NotificationCallableInvoker? _invoker;

  FirebaseFunctions get _resolvedFunctions => _functions ??=
      FirebaseFunctions.instanceFor(region: firebaseFunctionsRegion);

  Future<void> invoke({
    required String deviceId,
    required String activeDeviceToken,
    required DateTime lastSeenAtUtc,
  }) async {
    const callableName = 'registerDevice';
    final payload = <String, dynamic>{
      'deviceId': deviceId,
      'activeDeviceToken': activeDeviceToken,
      'lastSeenAt': lastSeenAtUtc.toIso8601String(),
    };

    if (_invoker != null) {
      await _invoker.call(callableName, payload);
      return;
    }

    final callable = _resolvedFunctions.httpsCallable(callableName);
    await callable.call(payload);
  }
}
