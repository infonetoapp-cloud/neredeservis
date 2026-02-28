import 'package:cloud_functions/cloud_functions.dart';

import '../../company/data/company_active_context_resolver.dart';
import '../../company/data/firebase_company_contract_client.dart';
import '../domain/driver_stop_mutation_repository.dart';

class FirebaseDriverStopMutationRepository
    implements DriverStopMutationRepository {
  FirebaseDriverStopMutationRepository({
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
  Future<DriverStopUpsertResult> upsertStop(
      DriverStopUpsertCommand command) async {
    final companyId = await _companyResolver.resolveActiveCompanyId(
      preferredCompanyId: command.companyId,
    );
    if (companyId != null) {
      final result = await _companyClient.upsertCompanyRouteStop(
        companyId: companyId,
        routeId: command.routeId,
        stopId: command.stopId,
        name: command.name,
        order: command.order,
        location: <String, double>{
          'lat': command.lat,
          'lng': command.lng,
        },
        lastKnownUpdateToken: command.lastKnownUpdateToken,
      );
      return DriverStopUpsertResult(
        stopId: result.stopId,
        updatedAt: result.updatedAt,
      );
    }

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
    final companyId = await _companyResolver.resolveActiveCompanyId(
      preferredCompanyId: command.companyId,
    );
    if (companyId != null) {
      await _companyClient.deleteCompanyRouteStop(
        companyId: companyId,
        routeId: command.routeId,
        stopId: command.stopId,
        lastKnownUpdateToken: command.lastKnownUpdateToken,
      );
      return;
    }

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
