import 'package:flutter_test/flutter_test.dart';
import 'package:neredeservis/features/driver/application/load_driver_home_route_section_use_case.dart';
import 'package:neredeservis/features/driver/domain/driver_home_route_section_repository.dart';

void main() {
  group('LoadDriverHomeRouteSectionUseCase', () {
    test('returns null for empty uid and skips repository', () async {
      final repository = _FakeDriverHomeRouteSectionRepository();
      final useCase = LoadDriverHomeRouteSectionUseCase(repository: repository);

      final result = await useCase.execute('   ');

      expect(result, isNull);
      expect(repository.loadCandidateRoutesCalls, 0);
      expect(repository.loadRouteStopsCalls, 0);
    });

    test('returns null when no candidate routes exist', () async {
      final repository = _FakeDriverHomeRouteSectionRepository();
      final useCase = LoadDriverHomeRouteSectionUseCase(repository: repository);

      final result = await useCase.execute('driver-1');

      expect(result, isNull);
      expect(repository.loadCandidateRoutesCalls, 1);
      expect(repository.loadRouteStopsCalls, 0);
    });

    test('selects owned route over newer shared route and sorts stops',
        () async {
      final repository = _FakeDriverHomeRouteSectionRepository(
        candidates: <DriverHomeRouteCandidate>[
          DriverHomeRouteCandidate(
            routeId: 'shared-new',
            routeName: 'Shared Route',
            updatedAtUtc: DateTime.utc(2026, 2, 23, 12),
            isOwnedByCurrentDriver: false,
          ),
          DriverHomeRouteCandidate(
            routeId: 'owned-old',
            routeName: 'Owned Route',
            updatedAtUtc: DateTime.utc(2026, 2, 22, 12),
            isOwnedByCurrentDriver: true,
          ),
        ],
        stopsByRouteId: <String, List<DriverHomeStopSummary>>{
          'owned-old': const <DriverHomeStopSummary>[
            DriverHomeStopSummary(
              stopId: 's2',
              name: 'B',
              order: 2,
              passengersWaiting: 3,
            ),
            DriverHomeStopSummary(
              stopId: 's1',
              name: 'A',
              order: 1,
              passengersWaiting: 1,
            ),
          ],
        },
      );
      final useCase = LoadDriverHomeRouteSectionUseCase(repository: repository);

      final result = await useCase.execute('driver-1');

      expect(result, isNotNull);
      expect(result!.routeId, 'owned-old');
      expect(result.routeName, 'Owned Route');
      expect(result.candidateRouteCount, 2);
      expect(result.queuedPassengerCount, 4);
      expect(result.stops.map((s) => s.stopId).toList(), <String>['s1', 's2']);
      expect(repository.loadRouteStopsCalls, 1);
      expect(repository.lastRouteId, 'owned-old');
    });

    test(
        'uses most recent route when ownership is same and normalizes zero queue',
        () async {
      final repository = _FakeDriverHomeRouteSectionRepository(
        candidates: <DriverHomeRouteCandidate>[
          DriverHomeRouteCandidate(
            routeId: 'older',
            routeName: 'Older',
            updatedAtUtc: DateTime.utc(2026, 2, 21, 12),
            isOwnedByCurrentDriver: true,
          ),
          DriverHomeRouteCandidate(
            routeId: 'newer',
            routeName: 'Newer',
            updatedAtUtc: DateTime.utc(2026, 2, 23, 12),
            isOwnedByCurrentDriver: true,
          ),
        ],
        stopsByRouteId: <String, List<DriverHomeStopSummary>>{
          'newer': const <DriverHomeStopSummary>[
            DriverHomeStopSummary(
              stopId: 's1',
              name: 'A',
              order: 1,
              passengersWaiting: 0,
            ),
            DriverHomeStopSummary(
              stopId: 's2',
              name: 'B',
              order: 2,
            ),
          ],
        },
      );
      final useCase = LoadDriverHomeRouteSectionUseCase(repository: repository);

      final result = await useCase.execute('driver-1');

      expect(result, isNotNull);
      expect(result!.routeId, 'newer');
      expect(result.queuedPassengerCount, isNull);
    });
  });
}

class _FakeDriverHomeRouteSectionRepository
    implements DriverHomeRouteSectionRepository {
  _FakeDriverHomeRouteSectionRepository({
    this.candidates = const <DriverHomeRouteCandidate>[],
    this.stopsByRouteId = const <String, List<DriverHomeStopSummary>>{},
  });

  final List<DriverHomeRouteCandidate> candidates;
  final Map<String, List<DriverHomeStopSummary>> stopsByRouteId;

  int loadCandidateRoutesCalls = 0;
  int loadRouteStopsCalls = 0;
  String? lastRouteId;

  @override
  Future<List<DriverHomeRouteCandidate>> loadCandidateRoutes(String uid) async {
    loadCandidateRoutesCalls++;
    return candidates;
  }

  @override
  Future<List<DriverHomeStopSummary>> loadRouteStops(String routeId) async {
    loadRouteStopsCalls++;
    lastRouteId = routeId;
    return stopsByRouteId[routeId] ?? const <DriverHomeStopSummary>[];
  }
}
