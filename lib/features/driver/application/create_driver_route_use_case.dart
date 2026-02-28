import '../domain/driver_route_create_repository.dart';

class CreateDriverRouteUseCase {
  CreateDriverRouteUseCase({
    required DriverRouteCreateRepository repository,
  }) : _repository = repository;

  final DriverRouteCreateRepository _repository;

  Future<DriverRouteCreateResult> execute({
    String? companyId,
    required String name,
    required double startLat,
    required double startLng,
    required String startAddress,
    required double endLat,
    required double endLng,
    required String endAddress,
    required String scheduledTime,
    required String timeSlot,
    required bool allowGuestTracking,
  }) {
    return _repository.createRoute(
      DriverRouteCreateCommand(
        companyId: companyId,
        name: name,
        startLat: startLat,
        startLng: startLng,
        startAddress: startAddress,
        endLat: endLat,
        endLng: endLng,
        endAddress: endAddress,
        scheduledTime: scheduledTime,
        timeSlot: timeSlot,
        allowGuestTracking: allowGuestTracking,
      ),
    );
  }
}
