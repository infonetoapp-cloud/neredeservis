import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/driver/application/select_primary_driver_route_candidate_use_case.dart';
import 'package:neredeservis/features/driver/domain/driver_home_route_section_repository.dart';

void main() {
  group('SelectPrimaryDriverRouteCandidateUseCase', () {
    test('returns empty result for empty uid and skips repository', () async {
      final repository = _FakeDriverHomeRouteSectionRepository();
      final useCase = SelectPrimaryDriverRouteCandidateUseCase(
        repository: repository,
      );

      final result = await useCase.execute('   ');

      expect(result.primaryRoute, isNull);
      expect(result.candidateRouteCount, 0);
      expect(repository.loadCandidateRoutesCalls, 0);
    });

    test('returns empty result when candidate list is empty', () async {
      final repository = _FakeDriverHomeRouteSectionRepository();
      final useCase = SelectPrimaryDriverRouteCandidateUseCase(
        repository: repository,
      );

      final result = await useCase.execute('driver-1');

      expect(result.primaryRoute, isNull);
      expect(result.candidateRouteCount, 0);
      expect(repository.loadCandidateRoutesCalls, 1);
    });

    test('prefers owned route over newer shared route', () async {
      final repository = _FakeDriverHomeRouteSectionRepository(
        candidates: <DriverHomeRouteCandidate>[
          DriverHomeRouteCandidate(
            routeId: 'shared-new',
            routeName: 'Shared',
            updatedAtUtc: DateTime.utc(2026, 2, 23, 12),
            isOwnedByCurrentDriver: false,
          ),
          DriverHomeRouteCandidate(
            routeId: 'owned-old',
            routeName: 'Owned',
            updatedAtUtc: DateTime.utc(2026, 2, 22, 12),
            isOwnedByCurrentDriver: true,
          ),
        ],
      );
      final useCase = SelectPrimaryDriverRouteCandidateUseCase(
        repository: repository,
      );

      final result = await useCase.execute('driver-1');

      expect(result.candidateRouteCount, 2);
      expect(result.primaryRoute, isNotNull);
      expect(result.primaryRoute!.routeId, 'owned-old');
    });

    test('within same ownership selects most recently updated route', () async {
      final repository = _FakeDriverHomeRouteSectionRepository(
        candidates: <DriverHomeRouteCandidate>[
          DriverHomeRouteCandidate(
            routeId: 'older',
            routeName: 'Older',
            updatedAtUtc: DateTime.utc(2026, 2, 22, 12),
            isOwnedByCurrentDriver: true,
          ),
          DriverHomeRouteCandidate(
            routeId: 'newer',
            routeName: 'Newer',
            updatedAtUtc: DateTime.utc(2026, 2, 23, 12),
            isOwnedByCurrentDriver: true,
          ),
        ],
      );
      final useCase = SelectPrimaryDriverRouteCandidateUseCase(
        repository: repository,
      );

      final result = await useCase.execute('driver-1');

      expect(result.primaryRoute, isNotNull);
      expect(result.primaryRoute!.routeId, 'newer');
      expect(result.candidateRouteCount, 2);
    });
  });
}

class _FakeDriverHomeRouteSectionRepository
    implements DriverHomeRouteSectionRepository {
  _FakeDriverHomeRouteSectionRepository({
    this.candidates = const <DriverHomeRouteCandidate>[],
  });

  final List<DriverHomeRouteCandidate> candidates;
  int loadCandidateRoutesCalls = 0;

  @override
  Future<List<DriverHomeRouteCandidate>> loadCandidateRoutes(String uid) async {
    loadCandidateRoutesCalls++;
    return candidates;
  }

  @override
  Future<List<DriverHomeStopSummary>> loadRouteStops(String routeId) async {
    throw UnimplementedError('Not used by selection use case');
  }
}
