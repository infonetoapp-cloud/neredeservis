import '../domain/passenger_route_leave_repository.dart';

class LeavePassengerRouteUseCase {
  LeavePassengerRouteUseCase({
    required PassengerRouteLeaveRepository repository,
  }) : _repository = repository;

  final PassengerRouteLeaveRepository _repository;

  Future<PassengerRouteLeaveResult> execute(
      PassengerRouteLeaveCommand command) {
    return _repository.leaveRoute(command);
  }
}
