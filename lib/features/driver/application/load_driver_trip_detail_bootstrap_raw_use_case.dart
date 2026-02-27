import '../domain/driver_trip_detail_bootstrap_repository.dart';

class LoadDriverTripDetailBootstrapRawUseCase {
  LoadDriverTripDetailBootstrapRawUseCase({
    required DriverTripDetailBootstrapRepository repository,
  }) : _repository = repository;

  final DriverTripDetailBootstrapRepository _repository;

  Future<DriverTripDetailBootstrapRawData?> execute({
    required String? routeId,
    required String? tripId,
  }) async {
    final normalizedRouteId = routeId?.trim();
    if (normalizedRouteId == null || normalizedRouteId.isEmpty) {
      return null;
    }
    final normalizedTripId = tripId?.trim();

    try {
      return await _repository.loadRawData(
        routeId: normalizedRouteId,
        tripId: (normalizedTripId == null || normalizedTripId.isEmpty)
            ? null
            : normalizedTripId,
      );
    } catch (_) {
      return null;
    }
  }
}
