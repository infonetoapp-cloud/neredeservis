import '../domain/company_contract_models.dart';
import 'backend_company_contract_client.dart';

class CompanyActiveContextResolver {
  CompanyActiveContextResolver({
    BackendCompanyContractClient? client,
    Future<List<CompanyMembershipSummary>> Function()? listMyCompanies,
  }) : _listMyCompanies =
           listMyCompanies ?? (client ?? BackendCompanyContractClient()).listMyCompanies;

  final Future<List<CompanyMembershipSummary>> Function() _listMyCompanies;
  static String? _cachedCompanyId;

  Future<String?> resolveActiveCompanyId({
    String? preferredCompanyId,
  }) async {
    final preferred = _normalize(preferredCompanyId);
    if (preferred != null) {
      _cachedCompanyId = preferred;
      return preferred;
    }

    final cached = _normalize(_cachedCompanyId);
    if (cached != null) {
      return cached;
    }

    try {
      final memberships = await _listMyCompanies();
      if (memberships.isEmpty) {
        return null;
      }
      final active = memberships
          .where((membership) => membership.memberStatus == 'active')
          .toList(growable: false);
      final fallbackList = active.isNotEmpty ? active : memberships;
      final selected = _normalize(fallbackList.first.companyId);
      _cachedCompanyId = selected;
      return selected;
    } catch (_) {
      return cached;
    }
  }

  Future<void> setActiveCompanyId(String? companyId) async {
    _cachedCompanyId = _normalize(companyId);
  }

  String? _normalize(String? value) {
    if (value == null) {
      return null;
    }
    final normalized = value.trim();
    return normalized.isEmpty ? null : normalized;
  }
}
