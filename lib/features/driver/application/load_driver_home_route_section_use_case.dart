import '../domain/driver_home_route_section_repository.dart';
import 'select_primary_driver_route_candidate_use_case.dart';

class DriverHomeRouteSectionResult {
  const DriverHomeRouteSectionResult({
    required this.routeId,
    required this.routeName,
    required this.stops,
    required this.candidateRouteCount,
    this.queuedPassengerCount,
  });

  final String routeId;
  final String routeName;
  final List<DriverHomeStopSummary> stops;
  final int candidateRouteCount;
  final int? queuedPassengerCount;
}

class LoadDriverHomeRouteSectionUseCase {
  LoadDriverHomeRouteSectionUseCase({
    required DriverHomeRouteSectionRepository repository,
    SelectPrimaryDriverRouteCandidateUseCase? selectPrimaryRouteUseCase,
  })  : _repository = repository,
        _selectPrimaryRouteUseCase = selectPrimaryRouteUseCase ??
            SelectPrimaryDriverRouteCandidateUseCase(repository: repository);

  final DriverHomeRouteSectionRepository _repository;
  final SelectPrimaryDriverRouteCandidateUseCase _selectPrimaryRouteUseCase;

  Future<DriverHomeRouteSectionResult?> execute(String uid) async {
    if (uid.trim().isEmpty) {
      return null;
    }

    final selection = await _selectPrimaryRouteUseCase.execute(uid);
    final primary = selection.primaryRoute;
    if (primary == null) {
      return null;
    }

    final stops = await _repository.loadRouteStops(primary.routeId);
    final sortedStops = stops.toList(growable: false)
      ..sort((left, right) => left.order.compareTo(right.order));
    final queuedPassengerCountValue = sortedStops
        .map((stop) => stop.passengersWaiting)
        .whereType<int>()
        .fold<int>(0, (acc, item) => acc + item);

    return DriverHomeRouteSectionResult(
      routeId: primary.routeId,
      routeName: primary.routeName,
      stops: sortedStops,
      candidateRouteCount: selection.candidateRouteCount,
      queuedPassengerCount:
          queuedPassengerCountValue > 0 ? queuedPassengerCountValue : null,
    );
  }
}
