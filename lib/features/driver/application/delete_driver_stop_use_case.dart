import '../domain/driver_stop_mutation_repository.dart';

class DeleteDriverStopUseCase {
  DeleteDriverStopUseCase({
    required DriverStopMutationRepository repository,
  }) : _repository = repository;

  final DriverStopMutationRepository _repository;

  Future<void> execute(DriverStopDeleteCommand command) {
    return _repository.deleteStop(command);
  }
}
