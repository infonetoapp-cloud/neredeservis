import '../domain/driver_trip_completed_bootstrap_repository.dart';

class LoadDriverTripCompletedBootstrapRawUseCase {
  LoadDriverTripCompletedBootstrapRawUseCase({
    required DriverTripCompletedBootstrapRepository repository,
  }) : _repository = repository;

  final DriverTripCompletedBootstrapRepository _repository;

  Future<DriverTripCompletedBootstrapRawData?> execute({
    required String? routeId,
    required String? tripId,
  }) async {
    final normalizedRouteId = routeId?.trim();
    final normalizedTripId = tripId?.trim();
    if (normalizedRouteId == null ||
        normalizedRouteId.isEmpty ||
        normalizedTripId == null ||
        normalizedTripId.isEmpty) {
      return null;
    }

    try {
      return await _repository.loadRawData(
        routeId: normalizedRouteId,
        tripId: normalizedTripId,
      );
    } catch (_) {
      return null;
    }
  }
}
