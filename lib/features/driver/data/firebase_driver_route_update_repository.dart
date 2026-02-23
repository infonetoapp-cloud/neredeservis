import 'package:cloud_functions/cloud_functions.dart';

import '../domain/driver_route_update_repository.dart';

class FirebaseDriverRouteUpdateRepository
    implements DriverRouteUpdateRepository {
  FirebaseDriverRouteUpdateRepository({
    required FirebaseFunctions functions,
  }) : _functions = functions;

  final FirebaseFunctions _functions;

  @override
  Future<void> updateRoute(DriverRouteUpdateCommand command) async {
    final updateRouteCallable = _functions.httpsCallable('updateRoute');
    final payload = <String, dynamic>{
      'routeId': command.routeId,
      if (command.name != null) 'name': command.name,
      if (command.startAddress != null) 'startAddress': command.startAddress,
      if (command.startPoint != null)
        'startPoint': <String, dynamic>{
          'lat': command.startPoint!.lat,
          'lng': command.startPoint!.lng,
        },
      if (command.endAddress != null) 'endAddress': command.endAddress,
      if (command.endPoint != null)
        'endPoint': <String, dynamic>{
          'lat': command.endPoint!.lat,
          'lng': command.endPoint!.lng,
        },
      if (command.scheduledTime != null) 'scheduledTime': command.scheduledTime,
      if (command.timeSlot != null) 'timeSlot': command.timeSlot,
      if (command.allowGuestTracking != null)
        'allowGuestTracking': command.allowGuestTracking,
      if (command.authorizedDriverIds != null)
        'authorizedDriverIds': command.authorizedDriverIds,
      if (command.isArchived != null) 'isArchived': command.isArchived,
      if (command.clearVacationUntil) 'vacationUntil': null,
      if (command.vacationUntil != null) 'vacationUntil': command.vacationUntil,
    };
    await updateRouteCallable.call(payload);

    if (command.inlineStopUpserts.isEmpty) {
      return;
    }

    final upsertStopCallable = _functions.httpsCallable('upsertStop');
    for (final stop in command.inlineStopUpserts) {
      await upsertStopCallable.call(<String, dynamic>{
        'routeId': command.routeId,
        'stopId': stop.stopId,
        'name': stop.name,
        'location': <String, dynamic>{
          'lat': stop.lat,
          'lng': stop.lng,
        },
        'order': stop.order,
      });
    }
  }
}
