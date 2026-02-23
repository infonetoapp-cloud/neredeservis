import '../domain/passenger_route_join_repository.dart';

class JoinPassengerRouteBySrvCodeUseCase {
  JoinPassengerRouteBySrvCodeUseCase({
    required PassengerRouteJoinRepository repository,
  }) : _repository = repository;

  final PassengerRouteJoinRepository _repository;

  Future<PassengerRouteJoinBySrvCodeResult> execute(
    PassengerRouteJoinBySrvCodeCommand command,
  ) {
    return _repository.joinBySrvCode(command);
  }
}
