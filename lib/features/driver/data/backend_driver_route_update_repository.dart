import '../../../core/errors/error_codes.dart';
import '../../../core/exceptions/app_exception.dart';
import '../../company/data/backend_company_contract_client.dart';
import '../../company/data/company_active_context_resolver.dart';
import '../domain/driver_route_update_repository.dart';

class BackendDriverRouteUpdateRepository
    implements DriverRouteUpdateRepository {
  BackendDriverRouteUpdateRepository({
    BackendCompanyContractClient? companyClient,
    CompanyActiveContextResolver? companyResolver,
  })  : _companyClient = companyClient ?? BackendCompanyContractClient(),
        _companyResolver = companyResolver ??
            CompanyActiveContextResolver(
              listMyCompanies: (companyClient ?? BackendCompanyContractClient())
                  .listMyCompanies,
            );

  final BackendCompanyContractClient _companyClient;
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
    if (companyId == null) {
      throw const AppException(
        code: ErrorCodes.failedPrecondition,
        message: 'Aktif firma bulunamadi. Once firma sec veya olustur.',
      );
    }

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
  }
}
