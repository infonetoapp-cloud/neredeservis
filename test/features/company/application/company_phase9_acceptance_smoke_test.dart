import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/company/application/map_company_live_ops_state_use_case.dart';
import 'package:neredeservis/features/company/data/company_active_context_resolver.dart';
import 'package:neredeservis/features/company/domain/company_contract_models.dart';
import 'package:neredeservis/features/driver/application/plan_route_mutation_write_failure_handling_use_case.dart';
import 'package:neredeservis/features/driver/application/plan_route_mutation_write_feedback_use_case.dart';
import 'package:neredeservis/features/driver/application/resolve_route_mutation_write_feedback_message_use_case.dart';

void main() {
  group('Phase9 acceptance smoke', () {
    test('company context recoverability (mode switch + relogin fallback)', () async {
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

      await resolver.setActiveCompanyId('cmp_active');
      final first = await resolver.resolveActiveCompanyId();
      expect(first, 'cmp_active');

      await resolver.setActiveCompanyId(null);
      final reloginFallback = await resolver.resolveActiveCompanyId();
      expect(reloginFallback, 'cmp_active');
    });

    test('route/stop conflict recovery copy includes reload + retry guidance', () {
      const failureHandling = PlanRouteMutationWriteFailureHandlingUseCase(
        planRouteMutationWriteFeedbackUseCase:
            PlanRouteMutationWriteFeedbackUseCase(),
        resolveRouteMutationWriteFeedbackMessageUseCase:
            ResolveRouteMutationWriteFeedbackMessageUseCase(),
      );

      final plan = failureHandling.execute(
        const PlanRouteMutationWriteFailureHandlingCommand.routeUpdateFailure()
            .withError(
          errorCode: 'failed-precondition',
          errorDetails: <String, dynamic>{
            'reasonCode': 'UPDATE_TOKEN_MISMATCH',
          },
        ),
      );

      expect(
        plan.feedbackMessage,
        'Rota baska bir cihazda degisti. Sayfayi yenileyip tekrar dene.',
      );
    });

    test('live ops fallback correctness (rtdb -> trip_doc) is stable', () {
      const mapper = MapCompanyLiveOpsStateUseCase();

      final onlineRtdb = mapper.mapTrip(
        liveState: 'online',
        liveSource: 'rtdb',
      );
      final staleTripDoc = mapper.mapTrip(
        liveState: 'stale',
        liveSource: 'trip_doc',
      );

      final rtdbStreamState = mapper.mapRtdbStreamState(
        hasSnapshot: true,
        hasTripMismatch: false,
        hasError: false,
        isAccessDenied: false,
      );
      final fallbackStreamState = mapper.mapRtdbStreamState(
        hasSnapshot: false,
        hasTripMismatch: false,
        hasError: true,
        isAccessDenied: false,
      );

      expect(onlineRtdb.tone, CompanyLiveStateTone.online);
      expect(onlineRtdb.sourceMode, CompanyLiveSourceMode.rtdb);
      expect(staleTripDoc.tone, CompanyLiveStateTone.stale);
      expect(staleTripDoc.sourceMode, CompanyLiveSourceMode.tripDoc);
      expect(rtdbStreamState, CompanyRtdbStreamState.live);
      expect(fallbackStreamState, CompanyRtdbStreamState.error);
    });
  });
}
