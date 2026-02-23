import '../domain/driver_home_route_section_repository.dart';

class SelectPrimaryDriverRouteCandidateResult {
  const SelectPrimaryDriverRouteCandidateResult({
    this.primaryRoute,
    this.candidateRouteCount = 0,
  });

  final DriverHomeRouteCandidate? primaryRoute;
  final int candidateRouteCount;
}

class SelectPrimaryDriverRouteCandidateUseCase {
  SelectPrimaryDriverRouteCandidateUseCase({
    required DriverHomeRouteSectionRepository repository,
  }) : _repository = repository;

  final DriverHomeRouteSectionRepository _repository;

  Future<SelectPrimaryDriverRouteCandidateResult> execute(String uid) async {
    if (uid.trim().isEmpty) {
      return const SelectPrimaryDriverRouteCandidateResult();
    }

    final candidates = await _repository.loadCandidateRoutes(uid);
    if (candidates.isEmpty) {
      return const SelectPrimaryDriverRouteCandidateResult();
    }

    final sortedCandidates = candidates.toList(growable: false)
      ..sort((left, right) {
        if (left.isOwnedByCurrentDriver != right.isOwnedByCurrentDriver) {
          return left.isOwnedByCurrentDriver ? -1 : 1;
        }
        return right.updatedAtUtc.compareTo(left.updatedAtUtc);
      });

    return SelectPrimaryDriverRouteCandidateResult(
      primaryRoute: sortedCandidates.first,
      candidateRouteCount: candidates.length,
    );
  }
}
