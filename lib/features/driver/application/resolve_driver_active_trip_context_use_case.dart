import '../domain/driver_active_trip_context_lookup_repository.dart';

class ResolveDriverActiveTripContextCommand {
  const ResolveDriverActiveTripContextCommand({
    required this.uid,
    this.tripId,
    this.routeId,
    this.initialTransitionVersion,
  });

  final String uid;
  final String? tripId;
  final String? routeId;
  final int? initialTransitionVersion;
}

class ResolveDriverActiveTripContextUseCase {
  ResolveDriverActiveTripContextUseCase({
    required DriverActiveTripContextLookupRepository repository,
  }) : _repository = repository;

  final DriverActiveTripContextLookupRepository _repository;

  Future<DriverActiveTripContextLookupResult?> execute(
    ResolveDriverActiveTripContextCommand command,
  ) {
    return _repository.resolveActiveTripContext(
      DriverActiveTripContextLookupCommand(
        uid: command.uid,
        tripId: command.tripId,
        routeId: command.routeId,
        initialTransitionVersion: command.initialTransitionVersion,
      ),
    );
  }
}
