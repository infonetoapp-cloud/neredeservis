import 'package:cloud_functions/cloud_functions.dart';

import '../domain/driver_route_create_repository.dart';

class FirebaseDriverRouteCreateRepository
    implements DriverRouteCreateRepository {
  FirebaseDriverRouteCreateRepository({
    required FirebaseFunctions functions,
  }) : _functions = functions;

  final FirebaseFunctions _functions;

  @override
  Future<DriverRouteCreateResult> createRoute(
      DriverRouteCreateCommand command) async {
    final callable = _functions.httpsCallable('createRoute');
    final response = await callable.call(<String, dynamic>{
      'name': command.name,
      'startPoint': <String, double>{
        'lat': command.startLat,
        'lng': command.startLng,
      },
      'startAddress': command.startAddress,
      'endPoint': <String, double>{
        'lat': command.endLat,
        'lng': command.endLng,
      },
      'endAddress': command.endAddress,
      'scheduledTime': command.scheduledTime,
      'timeSlot': command.timeSlot,
      'allowGuestTracking': command.allowGuestTracking,
      'authorizedDriverIds': const <String>[],
    });
    final payload = _extractCallableData(response.data);
    final routeId = _nullableParam(payload['routeId']);
    final srvCode = payload['srvCode'] as String? ?? '-';
    return DriverRouteCreateResult(
      routeId: routeId,
      srvCode: srvCode,
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
  final payload = <String, dynamic>{};
  return payload;
}

String? _nullableParam(Object? value) {
  if (value is! String) {
    return null;
  }
  final normalized = value.trim();
  return normalized.isEmpty ? null : normalized;
}
