import 'package:cloud_functions/cloud_functions.dart';

import '../domain/passenger_route_join_repository.dart';

class FirebasePassengerRouteJoinRepository
    implements PassengerRouteJoinRepository {
  FirebasePassengerRouteJoinRepository({
    required FirebaseFunctions functions,
  }) : _functions = functions;

  final FirebaseFunctions _functions;

  @override
  Future<PassengerRouteJoinBySrvCodeResult> joinBySrvCode(
    PassengerRouteJoinBySrvCodeCommand command,
  ) async {
    final callable = _functions.httpsCallable('joinRouteBySrvCode');
    final response = await callable.call(<String, dynamic>{
      'srvCode': command.srvCode,
      'name': command.name,
      if (command.phone != null && command.phone!.isNotEmpty)
        'phone': command.phone,
      'showPhoneToDriver': command.showPhoneToDriver,
      'boardingArea': command.boardingArea,
      'notificationTime': command.notificationTime,
    });
    final payload = _extractCallableData(response.data);
    return PassengerRouteJoinBySrvCodeResult(
      routeId: payload['routeId'] as String? ?? '',
      routeName: payload['routeName'] as String? ?? '',
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
