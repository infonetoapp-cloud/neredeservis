import 'package:cloud_functions/cloud_functions.dart';

import '../domain/driver_trip_start_repository.dart';

class FirebaseDriverTripStartRepository implements DriverTripStartRepository {
  FirebaseDriverTripStartRepository({
    required FirebaseFunctions functions,
  }) : _functions = functions;

  final FirebaseFunctions _functions;

  @override
  Future<DriverTripStartResult> startTrip(
      DriverTripStartCommand command) async {
    final callable = _functions.httpsCallable('startTrip');
    final response = await callable.call(<String, dynamic>{
      'routeId': command.routeId,
      'deviceId': command.deviceId,
      'idempotencyKey': command.idempotencyKey,
      'expectedTransitionVersion': command.expectedTransitionVersion,
    });
    final payload = _extractCallableData(response.data);
    return DriverTripStartResult(
      tripId: payload['tripId'] as String? ?? '',
      status: payload['status'] as String? ?? '',
    );
  }
}

Map<String, dynamic> _extractCallableData(dynamic raw) {
  if (raw is Map<String, dynamic>) {
    return raw;
  }
  if (raw is Map<Object?, Object?>) {
    return Map<String, dynamic>.from(raw);
  }
  return <String, dynamic>{};
}
