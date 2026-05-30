import '../../../core/errors/error_codes.dart';
import '../../../core/exceptions/app_exception.dart';
import '../../company/data/backend_company_contract_client.dart';
import '../../company/data/company_active_context_resolver.dart';
import '../domain/driver_stop_mutation_repository.dart';

class BackendDriverStopMutationRepository
    implements DriverStopMutationRepository {
  BackendDriverStopMutationRepository({
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
  Future<DriverStopUpsertResult> upsertStop(
    DriverStopUpsertCommand command,
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

  @override
  Future<void> deleteStop(DriverStopDeleteCommand command) async {
    final companyId = await _companyResolver.resolveActiveCompanyId(
      preferredCompanyId: command.companyId,
    );
    if (companyId == null) {
      throw const AppException(
        code: ErrorCodes.failedPrecondition,
        message: 'Aktif firma bulunamadi. Once firma sec veya olustur.',
      );
    }

    await _companyClient.deleteCompanyRouteStop(
      companyId: companyId,
      routeId: command.routeId,
      stopId: command.stopId,
      lastKnownUpdateToken: command.lastKnownUpdateToken,
    );
  }
}
