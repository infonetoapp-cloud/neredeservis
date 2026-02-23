import '../domain/driver_route_update_repository.dart';

class UpdateDriverRouteUseCase {
  UpdateDriverRouteUseCase({
    required DriverRouteUpdateRepository repository,
  }) : _repository = repository;

  final DriverRouteUpdateRepository _repository;

  Future<void> execute(DriverRouteUpdateCommand command) {
    return _repository.updateRoute(command);
  }
}
