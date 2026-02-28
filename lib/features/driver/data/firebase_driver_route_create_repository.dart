import 'package:cloud_functions/cloud_functions.dart';

import '../../company/data/company_active_context_resolver.dart';
import '../../company/data/firebase_company_contract_client.dart';
import '../domain/driver_route_create_repository.dart';

class FirebaseDriverRouteCreateRepository
    implements DriverRouteCreateRepository {
  FirebaseDriverRouteCreateRepository({
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
  Future<DriverRouteCreateResult> createRoute(
      DriverRouteCreateCommand command) async {
    final companyId = await _companyResolver.resolveActiveCompanyId(
      preferredCompanyId: command.companyId,
    );
    if (companyId != null) {
      final result = await _companyClient.createCompanyRoute(
        companyId: companyId,
        name: command.name,
        startPoint: <String, double>{
          'lat': command.startLat,
          'lng': command.startLng,
        },
        startAddress: command.startAddress,
        endPoint: <String, double>{
          'lat': command.endLat,
          'lng': command.endLng,
        },
        endAddress: command.endAddress,
        scheduledTime: command.scheduledTime,
        timeSlot: command.timeSlot,
        allowGuestTracking: command.allowGuestTracking,
        authorizedDriverIds: const <String>[],
      );
      return DriverRouteCreateResult(
        routeId: _nullableParam(result.routeId),
        srvCode: _nullableParam(result.srvCode) ?? '-',
      );
    }

    final legacyCallable = _functions.httpsCallable('createRoute');
    final legacyResponse = await legacyCallable.call(<String, dynamic>{
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
    final legacyPayload = _extractCallableData(legacyResponse.data);
    final legacyRouteId = _nullableParam(legacyPayload['routeId']);
    final legacySrvCode = legacyPayload['srvCode'] as String? ?? '-';
    return DriverRouteCreateResult(
      routeId: legacyRouteId,
      srvCode: legacySrvCode,
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
