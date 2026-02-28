import 'package:cloud_functions/cloud_functions.dart';

import '../../company/data/company_active_context_resolver.dart';
import '../../company/data/firebase_company_contract_client.dart';
import '../domain/driver_route_update_repository.dart';

class FirebaseDriverRouteUpdateRepository
    implements DriverRouteUpdateRepository {
  FirebaseDriverRouteUpdateRepository({
    required FirebaseFunctions functions,
    FirebaseCompanyContractClient? companyClient,
    CompanyActiveContextResolver? companyResolver,
  })  : _functions = functions,
        _companyClient = companyClient ??
            FirebaseCompanyContractClient(functions: functions),
        _companyResolver = companyResolver ??
            CompanyActiveContextResolver(
              client: companyClient ??
                  FirebaseCompanyContractClient(functions: functions),
            );

  final FirebaseFunctions _functions;
  final FirebaseCompanyContractClient _companyClient;
  final CompanyActiveContextResolver _companyResolver;

  @override
  Future<void> updateRoute(DriverRouteUpdateCommand command) async {
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

    final companyId = await _companyResolver.resolveActiveCompanyId(
      preferredCompanyId: command.companyId,
    );
    if (companyId != null) {
      var lastKnownToken = command.lastKnownUpdateToken;
      final routeUpdateResult = await _companyClient.updateCompanyRoute(
        companyId: companyId,
        routeId: command.routeId,
        patch: payload..remove('routeId'),
        lastKnownUpdateToken: lastKnownToken,
      );
      lastKnownToken = routeUpdateResult.updatedAt;

      if (command.inlineStopUpserts.isEmpty) {
        return;
      }

      for (final stop in command.inlineStopUpserts) {
        final stopResult = await _companyClient.upsertCompanyRouteStop(
          companyId: companyId,
          routeId: command.routeId,
          stopId: stop.stopId,
          name: stop.name,
          order: stop.order,
          location: <String, double>{
            'lat': stop.lat,
            'lng': stop.lng,
          },
          lastKnownUpdateToken: lastKnownToken,
        );
        lastKnownToken = stopResult.updatedAt;
      }
      return;
    }

    final updateRouteCallable = _functions.httpsCallable('updateRoute');
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
