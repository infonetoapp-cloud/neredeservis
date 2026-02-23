import 'package:cloud_functions/cloud_functions.dart';

import '../domain/passenger_route_leave_repository.dart';

class FirebasePassengerRouteLeaveRepository
    implements PassengerRouteLeaveRepository {
  FirebasePassengerRouteLeaveRepository({
    required FirebaseFunctions functions,
  }) : _functions = functions;

  final FirebaseFunctions _functions;

  @override
  Future<PassengerRouteLeaveResult> leaveRoute(
    PassengerRouteLeaveCommand command,
  ) async {
    final callable = _functions.httpsCallable('leaveRoute');
    final response = await callable.call(<String, dynamic>{
      'routeId': command.routeId,
    });
    final payload = _extractCallableData(response.data);
    return PassengerRouteLeaveResult(
      left: payload['left'] as bool? ?? false,
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
