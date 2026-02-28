import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/company/application/map_company_live_ops_state_use_case.dart';

void main() {
  group('MapCompanyLiveOpsStateUseCase', () {
    const useCase = MapCompanyLiveOpsStateUseCase();

    test('online+rtdb state dogru map edilir', () {
      final result = useCase.mapTrip(
        liveState: 'online',
        liveSource: 'rtdb',
      );

      expect(result.tone, CompanyLiveStateTone.online);
      expect(result.sourceMode, CompanyLiveSourceMode.rtdb);
    });

    test('stale+trip_doc state fallback map edilir', () {
      final result = useCase.mapTrip(
        liveState: 'stale',
        liveSource: 'trip_doc',
      );

      expect(result.tone, CompanyLiveStateTone.stale);
      expect(result.sourceMode, CompanyLiveSourceMode.tripDoc);
    });

    test('stream access denied oncelikli doner', () {
      final state = useCase.mapRtdbStreamState(
        hasSnapshot: true,
        hasTripMismatch: true,
        hasError: true,
        isAccessDenied: true,
      );

      expect(state, CompanyRtdbStreamState.accessDenied);
    });

    test('stream mismatch ve error semantigi dogru ayrilir', () {
      final mismatch = useCase.mapRtdbStreamState(
        hasSnapshot: true,
        hasTripMismatch: true,
        hasError: false,
        isAccessDenied: false,
      );
      final error = useCase.mapRtdbStreamState(
        hasSnapshot: false,
        hasTripMismatch: false,
        hasError: true,
        isAccessDenied: false,
      );

      expect(mismatch, CompanyRtdbStreamState.mismatch);
      expect(error, CompanyRtdbStreamState.error);
    });
  });
}
