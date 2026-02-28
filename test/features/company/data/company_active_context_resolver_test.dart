import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/company/data/company_active_context_resolver.dart';
import 'package:neredeservis/features/company/domain/company_contract_models.dart';

void main() {
  group('CompanyActiveContextResolver', () {
    test('uses preferred company id immediately', () async {
      final resolver = CompanyActiveContextResolver(
        listMyCompanies: () async => const <CompanyMembershipSummary>[],
      );

      final resolved =
          await resolver.resolveActiveCompanyId(preferredCompanyId: 'cmp_123');

      expect(resolved, 'cmp_123');
    });

    test('falls back to first active membership', () async {
      final resolver = CompanyActiveContextResolver(
        listMyCompanies: () async => const <CompanyMembershipSummary>[
          CompanyMembershipSummary(
            companyId: 'cmp_invited',
            name: 'Invited Co',
            role: 'viewer',
            memberStatus: 'invited',
          ),
          CompanyMembershipSummary(
            companyId: 'cmp_active',
            name: 'Active Co',
            role: 'dispatcher',
            memberStatus: 'active',
          ),
        ],
      );
      await resolver.setActiveCompanyId(null);

      final resolved = await resolver.resolveActiveCompanyId();

      expect(resolved, 'cmp_active');
    });
  });
}
