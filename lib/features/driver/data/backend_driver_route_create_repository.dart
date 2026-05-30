import '../../../core/errors/error_codes.dart';
import '../../../core/exceptions/app_exception.dart';
import '../../company/data/backend_company_contract_client.dart';
import '../../company/data/company_active_context_resolver.dart';
import '../domain/driver_route_create_repository.dart';

class BackendDriverRouteCreateRepository
    implements DriverRouteCreateRepository {
  BackendDriverRouteCreateRepository({
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
  Future<DriverRouteCreateResult> createRoute(
    DriverRouteCreateCommand command,
  ) async {
    final companyId = await _companyResolver.resolveActiveCompanyId(
      preferredCompanyId: command.companyId,
    );
    if (companyId == null) {
      throw const AppException(
        code: ErrorCodes.failedPrecondition,
        message: 'Aktif firma bulunamadi. Once firma sec veya olustur.',
      );
    }

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
}

String? _nullableParam(Object? value) {
  if (value is! String) {
    return null;
  }
  final normalized = value.trim();
  return normalized.isEmpty ? null : normalized;
}
