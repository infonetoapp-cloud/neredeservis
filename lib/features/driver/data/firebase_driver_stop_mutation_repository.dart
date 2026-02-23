import 'package:cloud_functions/cloud_functions.dart';

import '../domain/driver_stop_mutation_repository.dart';

class FirebaseDriverStopMutationRepository
    implements DriverStopMutationRepository {
  FirebaseDriverStopMutationRepository({
    required FirebaseFunctions functions,
  }) : _functions = functions;

  final FirebaseFunctions _functions;

  @override
  Future<DriverStopUpsertResult> upsertStop(
      DriverStopUpsertCommand command) async {
    final callable = _functions.httpsCallable('upsertStop');
    final response = await callable.call(<String, dynamic>{
      'routeId': command.routeId,
      if (command.stopId != null && command.stopId!.trim().isNotEmpty)
        'stopId': command.stopId,
      'name': command.name,
      'location': <String, dynamic>{
        'lat': command.lat,
        'lng': command.lng,
      },
      'order': command.order,
    });
    final payload = _extractCallableData(response.data);
    final stopId = payload['stopId'] as String? ?? '-';
    return DriverStopUpsertResult(stopId: stopId);
  }

  @override
  Future<void> deleteStop(DriverStopDeleteCommand command) async {
    final callable = _functions.httpsCallable('deleteStop');
    await callable.call(<String, dynamic>{
      'routeId': command.routeId,
      'stopId': command.stopId,
    });
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
